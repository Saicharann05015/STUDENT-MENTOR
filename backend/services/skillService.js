const SkillDiagnosis = require('../models/SkillDiagnosis');

class SkillService {
    // Create a new diagnosis
    static async createDiagnosis(userId, { category, results }) {
        // Calculate overall level from results
        const avgScore =
            results.reduce((sum, r) => sum + r.score, 0) / results.length;

        let overallLevel = 'beginner';
        if (avgScore >= 80) overallLevel = 'expert';
        else if (avgScore >= 60) overallLevel = 'advanced';
        else if (avgScore >= 40) overallLevel = 'intermediate';

        const diagnosis = await SkillDiagnosis.create({
            user: userId,
            category,
            results,
            overallLevel,
        });

        return diagnosis;
    }

    // Get all diagnoses for a user
    static async getUserDiagnoses(userId, query = {}) {
        const { page = 1, limit = 10, category } = query;
        const filter = { user: userId };
        if (category) filter.category = category;

        const diagnoses = await SkillDiagnosis.find(filter)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await SkillDiagnosis.countDocuments(filter);
        return { diagnoses, total, page: parseInt(page), pages: Math.ceil(total / limit) };
    }

    // Get single diagnosis
    static async getDiagnosisById(diagnosisId, userId) {
        const diagnosis = await SkillDiagnosis.findOne({ _id: diagnosisId, user: userId });
        if (!diagnosis) {
            throw Object.assign(new Error('Diagnosis not found'), { statusCode: 404 });
        }
        return diagnosis;
    }

    // Get latest diagnosis for a category
    static async getLatestByCategory(userId, category) {
        const diagnosis = await SkillDiagnosis.findOne({ user: userId, category })
            .sort({ createdAt: -1 });
        return diagnosis;
    }
}

module.exports = SkillService;
