const { generateAIResponse } = require('./geminiService');
const Progress = require('../models/Progress');
const Roadmap = require('../models/Roadmap');
const SkillProfile = require('../models/SkillProfile');
const logger = require('../utils/logger');

class RecommendationService {
  /**
   * Generate personalized recommendations for a user.
   * @param {string} userId
   */
  static async getRecommendations(userId) {
    try {
      // 1. Fetch User Data
      const progress = await Progress.findOne({ user: userId }).populate('roadmap');

      // If no active roadmap, we can't recommend much besides starting one
      if (!progress || !progress.roadmap) {
        return {
          nextConcept: {
            title: "Start your first learning roadmap!",
            description: "Choose a goal to begin your personalized learning journey.",
            link: "/dashboard/roadmap"
          },
          codingExercises: [],
          revisionTopics: [],
          miniProject: {
            title: "No Project Yet",
            description: "Complete some milestones to unlock projects."
          },
          message: "You haven't started a roadmap yet. Choose a goal to begin!"
        };
      }

      // 1.5 Check Cache
      const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours
      const now = new Date();
      if (progress.recommendations &&
        progress.recommendationsLastGenerated &&
        (now - progress.recommendationsLastGenerated) < CACHE_DURATION) {
        logger.debug(`Returning cached recommendations for user ${userId}`);
        return progress.recommendations;
      }

      const activeRoadmap = progress.roadmap;

      // 2. Fetch Skill Profile (if any)
      const skillProfile = await SkillProfile.findOne({
        user: userId,
        category: activeRoadmap.category
      });

      // 3. Find Current Milestone and Next Items
      const currentMilestoneIndex = activeRoadmap.milestones.findIndex(m => !m.isCompleted);
      const currentMilestone = activeRoadmap.milestones[currentMilestoneIndex] || activeRoadmap.milestones[activeRoadmap.milestones.length - 1];

      const nextTask = currentMilestone.practiceTasks.find(t => !t.isCompleted);
      const nextProject = currentMilestone.projects.find(p => !p.isCompleted);

      // 4. Generate AI Prompt for structured recommendations
      const prompt = `
Generate a highly targeted "Learning Recommendation Suite" for a student based on their current progress and skill gaps.

STUDENT PROFILE:
- Goal: ${activeRoadmap.goal}
- Category: ${activeRoadmap.category}
- Current Roadmap Progress: ${activeRoadmap.progressPercentage}%
- Weak Topics (Diagnosed): ${skillProfile?.weakTopics?.join(', ') || 'None yet identified'}
- Strong Topics (Diagnosed): ${skillProfile?.strongTopics?.join(', ') || 'None yet identified'}

CURRENT ROADMAP FOCUS (Week ${currentMilestone.week}):
- Milestone: ${currentMilestone.title}
- Concepts: ${currentMilestone.concepts.join(', ')}
- Pending Task: ${nextTask?.title || 'None'}
- Pending Project: ${nextProject?.title || 'None'}

Return ONLY a valid JSON object with the following structure:
{
  "nextConcept": {
    "title": "A catchy title for the very next specific concept to study",
    "description": "2 sentences explaining why this is the logical next step",
    "link": "https://developer.mozilla.org/..." (a real, highly relevant URL if applicable)
  },
  "codingExercises": [
    {
      "title": "A targeted problem name",
      "description": "Explain how this exercise specifically helps them improve on one of their WEAK TOPICS.",
      "difficulty": "beginner/intermediate/advanced"
    }
  ],
  "revisionTopics": [
     {
       "topic": "Name of a weak topic or a previous milestone topic",
       "reason": "Why they should revisit this (e.g., 'You struggled with this in your last diagnosis')."
     }
  ],
  "miniProject": {
    "title": "The 'Ultimate Challenge' Project",
    "description": "A mini-project prompt that combines a STRONG topic they already know with a WEAK topic to bridge the gap."
  }
}

Rules:
1. Provide exactly 2 coding exercises.
2. Provide exactly 2 revision topics.
3. Use the user's diagnosed weaknesses to drive the 'Coding Exercises' and 'Revision Topics'.
4. Ensure the 'Mini Project' is a creative hybrid of a strength and a weakness.
`;

      const aiResponse = await generateAIResponse(prompt, {
        context: 'roadmap',
        isJson: true,
        customInstruction: "You are an expert personalized learning assistant. Return ONLY valid JSON."
      });

      let recommendations;
      try {
        recommendations = JSON.parse(aiResponse);
      } catch (parseError) {
        logger.error(`Failed to parse AI recommendations: ${parseError.message}`);
        recommendations = {
          nextConcept: {
            title: `Continue with ${activeRoadmap.category}`,
            description: "Keep working through your current roadmap milestones.",
            link: "/dashboard/roadmap"
          },
          codingExercises: [
            { title: "Daily Practice", description: "Work on exercises from your current milestone.", difficulty: "intermediate" },
            { title: "Code Review", description: "Review and refactor previous solutions.", difficulty: "intermediate" }
          ],
          revisionTopics: [
            { topic: activeRoadmap.category, reason: "Regular revision strengthens your foundation." }
          ],
          miniProject: {
            title: `${activeRoadmap.category} Mini Challenge`,
            description: "Build a small project combining concepts from your completed milestones."
          }
        };
      }

      // 5. Update Cache
      progress.recommendations = recommendations;
      progress.recommendationsLastGenerated = now;
      await progress.save();

      logger.info(`Generated and cached recommendations for user ${userId} in ${activeRoadmap.category}`);
      return recommendations;

    } catch (error) {
      logger.error(`Failed to generate recommendations for user ${userId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = RecommendationService;
