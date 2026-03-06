const geminiService = require('./geminiService');
const Roadmap = require('../models/Roadmap');
const SkillProfile = require('../models/SkillProfile');
const Progress = require('../models/Progress');
const logger = require('../utils/logger');

// ============================================================
// ROADMAP ENGINE
// AI-powered personalized learning roadmap generator
// ============================================================

class RoadmapEngine {
    /**
     * Generate a complete personalized learning roadmap.
     * @param {string} userId
     * @param {Object} input
     * @param {string} input.goal - What the student wants to learn/achieve
     * @param {string} input.currentLevel - beginner | intermediate | advanced | expert
     * @param {string} input.timeline - e.g. "3 months", "8 weeks"
     * @param {string} input.dailyLearningTime - e.g. "2 hours", "45 minutes"
     * @param {string} input.category - Subject area (e.g. "JavaScript", "Machine Learning")
     */
    static async generateRoadmap(userId, input) {
        const { goal, currentLevel, timeline, dailyLearningTime, category } = input;

        // Parse timeline into weeks
        const totalWeeks = this._parseTimeline(timeline);

        // Fetch user's skill profile for this category to personalize the roadmap
        const skillProfile = await SkillProfile.findOne({ user: userId, category });
        if (skillProfile) {
            logger.info(`Found skill profile for ${userId} in ${category}. Personalizing roadmap...`);
        }

        // Generate roadmap content via AI
        const roadmapData = await this._generateRoadmapContent({
            goal,
            currentLevel: skillProfile?.difficultyLevel || currentLevel,
            totalWeeks,
            dailyLearningTime,
            category,
            skillProfile, // Pass profile for personalization
        });

        // Create and save the roadmap
        const roadmap = await Roadmap.create({
            user: userId,
            title: roadmapData.title,
            description: roadmapData.description,
            category,
            goal,
            currentLevel,
            targetLevel: roadmapData.targetLevel || 'advanced',
            timeline,
            dailyLearningTime,
            milestones: roadmapData.milestones,
            totalWeeks,
            estimatedCompletion: roadmapData.estimatedCompletion,
            isGenerated: true,
        });

        // Link this roadmap to the user's Progress record (fixes Recommendations)
        await Progress.findOneAndUpdate(
            { user: userId },
            { roadmap: roadmap._id },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        logger.info(`Roadmap generated for user ${userId}: "${roadmap.title}" (${totalWeeks} weeks)`);

        return roadmap;
    }

    /**
     * Regenerate / refine an existing roadmap based on feedback
     */
    static async refineRoadmap(roadmapId, userId, feedback) {
        const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId });
        if (!roadmap) {
            throw Object.assign(new Error('Roadmap not found'), { statusCode: 404 });
        }

        const totalWeeks = roadmap.totalWeeks || this._parseTimeline(roadmap.timeline);

        const refinedData = await this._refineRoadmapContent({
            existingRoadmap: roadmap,
            feedback,
            totalWeeks,
        });

        roadmap.milestones = refinedData.milestones;
        roadmap.description = refinedData.description || roadmap.description;
        await roadmap.save();

        return roadmap;
    }

    // ============================================================
    // PRIVATE: AI GENERATION
    // ============================================================

    static async _generateRoadmapContent({ goal, currentLevel, totalWeeks, dailyLearningTime, category, skillProfile }) {
        const personalizationText = skillProfile
            ? `
PERSONALIZATION DATA:
- Identified Strengths: ${skillProfile.strongTopics.join(", ") || "None yet identified"}
- Identified Weaknesses/Gaps: ${skillProfile.weakTopics.join(", ") || "None yet identified"}
- Current Assessment Score: ${skillProfile.lastAssessmentScore}%
- Current Skill Level: ${skillProfile.difficultyLevel}

ADAPTATION RULES:
1. Accelerate through strong topics (cover them early or more briefly).
2. Dedicate more time, practice problems, and clear explanations to identified weaknesses/gaps.
3. Ensure the starting difficulty aligns with the student's current skill level (${skillProfile.difficultyLevel}).
`
            : "";

        const prompt = `Create a highly detailed, PERSONALIZED learning roadmap with the following inputs:

- **Goal**: ${goal}
- **Subject/Category**: ${category}
- **Target User Level**: ${currentLevel}
- **Timeline**: ${totalWeeks} weeks
- **Daily Study Time**: ${dailyLearningTime}
${personalizationText}

Return ONLY a valid JSON object. The JSON must follow this structure:

{
  "title": "A personalized roadmap title",
  "description": "Overview of this adaptive path",
  "targetLevel": "intermediate or advanced or expert",
  "estimatedCompletion": "${totalWeeks} weeks",
  "milestones": [
    {
      "week": 1,
      "title": "Week 1: [Topic]",
      "description": "Learning outcomes",
      "concepts": ["Theoretical concept 1", "Theoretical concept 2"],
      "practiceTasks": [
        { "title": "Problem: [Name]", "description": "Specific exercise description", "type": "exercise" },
        { "title": "Real-world Quiz", "description": "Scenario-based questions", "type": "quiz" }
      ],
      "projects": [
        { "title": "Mini Project: [Name]", "description": "Hands-on implementation task", "difficulty": "easy" }
      ],
      "resources": [
        { "title": "Documentation", "url": "Official URL", "type": "article" }
      ],
      "estimatedHours": 10,
      "order": 1
    }
  ]
}

Rules:
1. Create exactly ${totalWeeks} weekly milestones.
2. Every week MUST include: 2-3 specific theoretical concepts, 2-3 focused practice problems, and 1 hands-on mini-project.
3. The content MUST adapt based on the PERSONALIZATION DATA provided above. 
4. If a student is weak in a topic, ensure it is covered thoroughly in early weeks with specific projects.
5. If a student is strong in a topic, move to its advanced applications quickly.
6. Provide REAL, relevant resource links where possible.`;

        const response = await geminiService.generateAIResponse(prompt, {
            customInstruction: 'You are an expert curriculum designer. Return ONLY valid JSON.',
            isJson: true,
        });

        return this._parseAIResponse(response, { totalWeeks, category, goal });
    }

    static async _refineRoadmapContent({ existingRoadmap, feedback, totalWeeks }) {
        const currentMilestones = existingRoadmap.milestones.map((m) => ({
            week: m.week,
            title: m.title,
            concepts: m.concepts,
        }));

        const prompt = `Here is an existing learning roadmap for "${existingRoadmap.category}":

${JSON.stringify(currentMilestones, null, 2)}

The student provided this feedback: "${feedback}"

Regenerate the roadmap milestones incorporating their feedback. Keep the same ${totalWeeks}-week structure.

Return ONLY a valid JSON object with this structure:
{
  "description": "Updated description",
  "milestones": [ ...same structure as before... ]
}`;

        const response = await geminiService.generateAIResponse(prompt, {
            customInstruction: 'You are an expert curriculum designer. Return ONLY valid JSON.',
            isJson: true,
        });

        return this._parseAIResponse(response, {
            totalWeeks,
            category: existingRoadmap.category,
            goal: existingRoadmap.goal,
        });
    }

    // ============================================================
    // PRIVATE: HELPERS
    // ============================================================

    static _parseTimeline(timeline) {
        const lower = timeline.toLowerCase().trim();

        // Match "X weeks"
        const weekMatch = lower.match(/(\d+)\s*week/);
        if (weekMatch) return parseInt(weekMatch[1]);

        // Match "X months" → approximate weeks
        const monthMatch = lower.match(/(\d+)\s*month/);
        if (monthMatch) return parseInt(monthMatch[1]) * 4;

        // Match "X days" → approximate weeks
        const dayMatch = lower.match(/(\d+)\s*day/);
        if (dayMatch) return Math.max(1, Math.ceil(parseInt(dayMatch[1]) / 7));

        // Default: 4 weeks
        return 4;
    }

    static _parseAIResponse(response, fallbackInfo) {
        try {
            // Because we pass responseMimeType: 'application/json', the response is guaranteed to be pure JSON
            const data = JSON.parse(response.trim());

            // Validate and sanitize milestones
            if (data.milestones && Array.isArray(data.milestones)) {
                data.milestones = data.milestones.map((m, i) => ({
                    week: m.week || i + 1,
                    title: m.title || `Week ${i + 1}`,
                    description: m.description || '',
                    concepts: Array.isArray(m.concepts) ? m.concepts : [],
                    practiceTasks: Array.isArray(m.practiceTasks)
                        ? m.practiceTasks.map((t) => ({
                            title: t.title || 'Practice Task',
                            description: t.description || '',
                            type: t.type || 'exercise',
                        }))
                        : [],
                    projects: Array.isArray(m.projects)
                        ? m.projects.map((p) => ({
                            title: p.title || 'Project',
                            description: p.description || '',
                            difficulty: p.difficulty || 'medium',
                        }))
                        : [],
                    resources: Array.isArray(m.resources)
                        ? m.resources.map((r) => ({
                            title: r.title || 'Resource',
                            url: r.url || '#',
                            type: r.type || 'article',
                        }))
                        : [],
                    estimatedHours: m.estimatedHours || 10,
                    order: i + 1,
                }));
            }

            return data;
        } catch (parseError) {
            logger.error(`Failed to parse roadmap AI response: ${parseError.message}`);
            return this._getFallbackRoadmap(fallbackInfo);
        }
    }

    static _getFallbackRoadmap({ totalWeeks, category, goal }) {
        const milestones = [];
        for (let i = 1; i <= totalWeeks; i++) {
            const difficulty = i <= totalWeeks / 3 ? 'easy' : i <= (totalWeeks * 2) / 3 ? 'medium' : 'hard';
            milestones.push({
                week: i,
                title: `Week ${i}: ${category} - Phase ${Math.ceil(i / (totalWeeks / 3))}`,
                description: `Continue building ${category} skills towards: ${goal}`,
                concepts: [`${category} concept for week ${i}`],
                practiceTasks: [
                    { title: `Practice exercise ${i}`, description: `Hands-on practice`, type: 'exercise' },
                    { title: `Review quiz ${i}`, description: `Test your understanding`, type: 'quiz' },
                ],
                projects: [
                    { title: `Week ${i} project`, description: `Apply what you learned`, difficulty },
                ],
                resources: [],
                estimatedHours: 10,
                order: i,
            });
        }

        return {
            title: `${category} Learning Roadmap`,
            description: `A ${totalWeeks}-week personalized path to achieve: ${goal}`,
            targetLevel: 'advanced',
            estimatedCompletion: `${totalWeeks} weeks`,
            milestones,
        };
    }
}

module.exports = RoadmapEngine;
