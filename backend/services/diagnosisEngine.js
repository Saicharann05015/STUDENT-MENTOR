const { generateAIResponse } = require('./geminiService');
const { cleanCode } = require('../utils/codeUtils');
const SkillDiagnosis = require('../models/SkillDiagnosis');
const SkillProfile = require('../models/SkillProfile');
const logger = require('../utils/logger');

// ============================================================
// DIAGNOSIS ENGINE
// AI-powered skill assessment with adaptive questioning
// ============================================================

class DiagnosisEngine {
    /**
     * Start a new diagnosis session — generates initial question JIT
     */
    static async startDiagnosis(userId, category) {
        // Generate only the first question (Conceptual, Medium)
        const firstQuestion = await this._generateSingleQuestion(category, 'conceptual', 'medium');

        const diagnosis = await SkillDiagnosis.create({
            user: userId,
            category,
            status: 'in-progress',
            currentQuestionIndex: 0,
            questions: [firstQuestion],
        });

        return {
            diagnosisId: diagnosis._id,
            totalQuestions: 9, // We aim for 9 total questions but generate them JIT
            currentQuestion: this._formatQuestion(diagnosis.questions[0], 0, 9),
        };
    }

    /**
     * Get the current question for an in-progress diagnosis
     */
    static async getCurrentQuestion(diagnosisId, userId) {
        const diagnosis = await SkillDiagnosis.findOne({
            _id: diagnosisId,
            user: userId,
        });

        if (!diagnosis) {
            throw Object.assign(new Error('Diagnosis not found'), { statusCode: 404 });
        }

        if (diagnosis.status === 'completed') {
            return { completed: true, scores: diagnosis.scores, summary: diagnosis.summary };
        }

        const idx = diagnosis.currentQuestionIndex;
        return {
            diagnosisId: diagnosis._id,
            totalQuestions: 9,
            currentQuestion: this._formatQuestion(diagnosis.questions[idx], idx, 9),
            progress: `${idx + 1}/9`,
        };
    }

    /**
     * Submit an answer, evaluate it via AI, and move to the next question
     */
    static async submitAnswer(diagnosisId, userId, answer) {
        const diagnosis = await SkillDiagnosis.findOne({
            _id: diagnosisId,
            user: userId,
        });

        if (!diagnosis) {
            throw Object.assign(new Error('Diagnosis not found'), { statusCode: 404 });
        }

        if (diagnosis.status === 'completed') {
            throw Object.assign(new Error('Diagnosis already completed'), { statusCode: 400 });
        }

        const idx = diagnosis.currentQuestionIndex;
        const currentQ = diagnosis.questions[idx];

        // Store the user's answer
        currentQ.userAnswer = answer;
        currentQ.answeredAt = new Date();

        // 1. Optimization: Preprocess code/answer
        const cleanedAnswer = currentQ.type === 'coding' ? cleanCode(answer) : answer.trim();

        // Evaluate the answer via AI
        const evalStartTime = Date.now();

        // Evaluate the answer via AI
        const evaluation = await this._evaluateAnswer(
            diagnosis.category,
            currentQ.question,
            currentQ.type,
            currentQ.difficulty,
            cleanedAnswer
        );

        logger.debug(`Evaluation for user ${userId} Q${idx} took ${Date.now() - evalStartTime}ms`);

        currentQ.evaluation = {
            isCorrect: evaluation.isCorrect,
            score: evaluation.score,
            feedback: evaluation.feedback,
            mistakes: evaluation.mistakes,
            improvementSuggestions: evaluation.improvementSuggestions,
            correctSolution: evaluation.correctSolution
        };

        // Move to next question or complete
        const isLast = idx >= 8; // Target 9 questions total (indexed 0-8)

        if (isLast) {
            // Calculate final scores and complete the diagnosis
            const finalResult = await this._calculateScores(diagnosis);
            diagnosis.scores = finalResult.scores;
            diagnosis.overallScore = finalResult.overallScore;
            diagnosis.overallLevel = finalResult.overallLevel;
            diagnosis.results = finalResult.results;
            diagnosis.recommendations = finalResult.recommendations;
            diagnosis.summary = finalResult.summary;
            diagnosis.status = 'completed';
            diagnosis.completedAt = new Date();

            // Store user skill profile in MongoDB
            await SkillProfile.findOneAndUpdate(
                { user: userId, category: diagnosis.category },
                {
                    strongTopics: finalResult.strongTopics || [],
                    weakTopics: finalResult.weakTopics || [],
                    difficultyLevel: finalResult.overallLevel || 'beginner',
                    lastAssessmentScore: finalResult.overallScore || 0,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        } else {
            // Adaptive Difficulty and CONTENT Generation
            let nextDifficulty = 'medium';
            let nextType = 'conceptual';

            // Determine next type based on index
            if (idx + 1 < 3) nextType = 'conceptual';
            else if (idx + 1 < 6) nextType = 'coding';
            else nextType = 'problem-solving';

            // Logic for difficulty adjustment based on current performance
            if (evaluation.score < 50) {
                nextDifficulty = 'easy';
            } else if (evaluation.score >= 80) {
                nextDifficulty = 'hard';
            } else {
                nextDifficulty = 'medium';
            }

            // Generate the next question JIT
            const nextQuestion = await this._generateSingleQuestion(
                diagnosis.category,
                nextType,
                nextDifficulty,
                diagnosis.questions // Pass history to avoid repetition
            );

            diagnosis.questions.push(nextQuestion);
            diagnosis.currentQuestionIndex = idx + 1;
        }

        await diagnosis.save();

        // Build response
        if (isLast) {
            return {
                completed: true,
                evaluation: currentQ.evaluation,
                scores: diagnosis.scores,
                overallScore: diagnosis.overallScore,
                overallLevel: diagnosis.overallLevel,
                recommendations: diagnosis.recommendations,
                summary: diagnosis.summary,
            };
        }

        const nextQ = diagnosis.questions[idx + 1];
        return {
            completed: false,
            evaluation: currentQ.evaluation,
            nextQuestion: this._formatQuestion(nextQ, idx + 1, 9),
            progress: `${idx + 2}/9`,
        };
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    /**
     * Generate a single diagnostic question JIT via Gemini
     */
    static async _generateSingleQuestion(category, type, difficulty, previousQuestions = []) {
        const historyText = previousQuestions.length > 0
            ? `Avoid repeating: ${previousQuestions.slice(-3).map(q => q.question.substring(0, 30)).join(" | ")}`
            : "";

        const prompt = `Gen 1 "${category}" question.
Type: ${type}, Difficulty: ${difficulty}.
${historyText}

JSON ONLY:
{
  "type": "${type}",
  "difficulty": "${difficulty}",
  "question": "string"
}`;

        const response = await generateAIResponse(prompt, {
            context: 'skill-diagnosis-jit',
            customInstruction: 'You are a precise technical assessment generator. Return ONLY valid JSON.',
            isJson: true,
            maxTokens: 300,
        });

        try {
            const q = JSON.parse(response.trim());
            return {
                type: q.type || type,
                difficulty: q.difficulty || difficulty,
                question: q.question || 'Explain a core concept of this category.'
            };
        } catch (parseError) {
            logger.error(`Failed to parse JIT AI question: ${parseError.message}`);
            // Fallback for single question
            return this._getFallbackQuestions(category)[previousQuestions.length % 9];
        }
    }

    /**
     * Evaluate a student's answer via Gemini
     */
    static async _evaluateAnswer(category, question, type, difficulty, answer) {
        const prompt = `Evaluate student's "${category}" answer.
Q Type: ${type}, Diff: ${difficulty}
Q: ${question}
Student A: ${answer}

Return JSON ONLY:
{
  "isCorrect": boolean,
  "score": 0-100,
  "feedback": "Concise feedback (max 2 sentences)",
  "mistakes": ["short string"],
  "improvementSuggestions": ["short string"],
  "correctSolution": "Concise solution code/text"
}`;

        const response = await generateAIResponse(prompt, {
            customInstruction: 'You are a fair, expert technical evaluator. Return ONLY valid JSON.',
            isJson: true,
            maxTokens: 600,
        });

        try {
            const evaluation = JSON.parse(response.trim());

            return {
                isCorrect: Boolean(evaluation.isCorrect),
                score: Math.min(100, Math.max(0, Number(evaluation.score) || 0)),
                feedback: evaluation.feedback || 'Answer evaluated.',
                mistakes: Array.isArray(evaluation.mistakes) ? evaluation.mistakes : [],
                improvementSuggestions: Array.isArray(evaluation.improvementSuggestions) ? evaluation.improvementSuggestions : [],
                correctSolution: evaluation.correctSolution || ''
            };
        } catch (parseError) {
            logger.error(`Failed to parse AI evaluation: ${parseError.message}`);
            return {
                isCorrect: false,
                score: 30,
                feedback: 'We had trouble evaluating this answer automatically. Your response has been recorded.',
                mistakes: [],
                improvementSuggestions: [],
                correctSolution: ''
            };
        }
    }

    /**
     * Calculate final scores from all evaluated questions
     */
    static async _calculateScores(diagnosis) {
        const questions = diagnosis.questions;

        // Group scores by type
        const conceptualScores = questions
            .filter((q) => q.type === 'conceptual')
            .map((q) => q.evaluation.score);

        const codingScores = questions
            .filter((q) => q.type === 'coding')
            .map((q) => q.evaluation.score);

        const problemSolvingScores = questions
            .filter((q) => q.type === 'problem-solving')
            .map((q) => q.evaluation.score);

        // Calculate weighted averages (harder questions weigh more)
        const weightedAvg = (scores) => {
            if (scores.length === 0) return 0;
            // weights: easy=1, medium=1.5, hard=2
            const weights = [1, 1.5, 2];
            const totalWeight = weights.slice(0, scores.length).reduce((a, b) => a + b, 0);
            const weighted = scores.reduce((sum, score, i) => sum + score * (weights[i] || 1), 0);
            return Math.round(weighted / totalWeight);
        };

        const programming_score = weightedAvg(codingScores);
        const logic_score = weightedAvg(conceptualScores);
        const problem_solving_score = weightedAvg(problemSolvingScores);
        const overallScore = Math.round((programming_score + logic_score + problem_solving_score) / 3);

        // Determine level
        let overallLevel = 'beginner';
        if (overallScore >= 80) overallLevel = 'expert';
        else if (overallScore >= 60) overallLevel = 'advanced';
        else if (overallScore >= 40) overallLevel = 'intermediate';

        // Build per-skill results
        const results = [
            {
                skill: 'Programming',
                score: programming_score,
                level: this._scoreToLevel(programming_score),
                feedback: this._scoreFeedback('Programming', programming_score),
            },
            {
                skill: 'Logic & Concepts',
                score: logic_score,
                level: this._scoreToLevel(logic_score),
                feedback: this._scoreFeedback('Logic', logic_score),
            },
            {
                skill: 'Problem Solving',
                score: problem_solving_score,
                level: this._scoreToLevel(problem_solving_score),
                feedback: this._scoreFeedback('Problem Solving', problem_solving_score),
            },
        ];

        // Generate AI recommendations
        const recommendations = await this._generateRecommendations(
            diagnosis.category,
            { programming_score, logic_score, problem_solving_score },
            overallLevel,
            diagnosis.questions
        );

        return {
            scores: { programming_score, logic_score, problem_solving_score },
            overallScore,
            overallLevel,
            results,
            recommendations: recommendations.tips,
            summary: recommendations.summary,
            strongTopics: recommendations.strongTopics || [],
            weakTopics: recommendations.weakTopics || []
        };
    }

    /**
     * Generate personalized recommendations via AI
     */
    static async _generateRecommendations(category, scores, level, questionsData = []) {
        // Collect brief summary of questions and user success string
        const testContext = questionsData.map(q =>
            `Q(${q.type}): ${q.evaluation?.score || 0}/100 score.`
        ).join(" ");

        const prompt = `A student just completed a "${category}" skill diagnosis. Here are their scores:

- Programming: ${scores.programming_score}/100
- Logic & Concepts: ${scores.logic_score}/100
- Problem Solving: ${scores.problem_solving_score}/100
- Overall Level: ${level}
- Test Context: ${testContext}

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "summary": "A 2-3 sentence encouraging summary of their performance",
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
  "strongTopics": ["Array of up to 3 sub-topics or skills they excelled at"],
  "weakTopics": ["Array of up to 3 specific sub-topics or concepts they should improve on"]
}

Analyze their scores and use your domain knowledge of "${category}" to deduce specific sub-topics for their strong and weak lists.`;

        const response = await generateAIResponse(prompt, {
            customInstruction: 'You are a helpful learning advisor mapping technical skill topographies. Return ONLY valid JSON.',
            isJson: true,
        });

        try {
            return JSON.parse(response.trim());
        } catch {
            return {
                summary: `You scored ${scores.programming_score} in programming, ${scores.logic_score} in logic, and ${scores.problem_solving_score} in problem solving. Keep practicing!`,
                tips: ['Practice daily coding challenges', 'Review core concepts', 'Work on real projects'],
                strongTopics: [],
                weakTopics: ['Fundamentals']
            };
        }
    }

    // ---- Utility Methods ----

    static _scoreToLevel(score) {
        if (score >= 80) return 'expert';
        if (score >= 60) return 'advanced';
        if (score >= 40) return 'intermediate';
        return 'beginner';
    }

    static _scoreFeedback(skill, score) {
        if (score >= 80) return `Excellent ${skill} skills! You demonstrate strong mastery.`;
        if (score >= 60) return `Good ${skill} foundation. A bit more practice will make you shine.`;
        if (score >= 40) return `Decent ${skill} understanding. Focus on strengthening the fundamentals.`;
        return `${skill} needs work — but that's okay! Everyone starts somewhere. Let's build this up.`;
    }

    static _formatQuestion(question, index, total) {
        return {
            number: index + 1,
            total,
            type: question.type,
            difficulty: question.difficulty,
            question: question.question,
        };
    }

    /**
     * Fallback questions if AI generation fails
     */
    static _getFallbackQuestions(category) {
        return [
            { type: 'conceptual', difficulty: 'easy', question: `What is ${category}? Explain in your own words.` },
            { type: 'conceptual', difficulty: 'medium', question: `What are the key concepts or principles in ${category}?` },
            { type: 'conceptual', difficulty: 'hard', question: `Compare and contrast two major approaches or paradigms in ${category}.` },
            { type: 'coding', difficulty: 'easy', question: `Write a simple example or code snippet related to ${category}.` },
            { type: 'coding', difficulty: 'medium', question: `Write a function that demonstrates a core concept in ${category}.` },
            { type: 'coding', difficulty: 'hard', question: `Write an optimized solution for a common problem in ${category}. Explain your approach.` },
            { type: 'problem-solving', difficulty: 'easy', question: `You're asked to build a small project using ${category}. What steps would you take first?` },
            { type: 'problem-solving', difficulty: 'medium', question: `A junior developer is stuck on a ${category} bug. How would you help them debug it systematically?` },
            { type: 'problem-solving', difficulty: 'hard', question: `Design a scalable system that heavily uses ${category}. Explain your architecture decisions and trade-offs.` },
        ];
    }
}

module.exports = DiagnosisEngine;
