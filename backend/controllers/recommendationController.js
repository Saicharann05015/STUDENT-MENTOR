const RecommendationService = require('../services/recommendationService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get personalized learning recommendations
// @route   GET /api/v1/recommendations
exports.getRecommendations = asyncHandler(async (req, res) => {
    const recommendations = await RecommendationService.getRecommendations(req.user.id);
    ApiResponse.success(res, { data: recommendations, message: 'Personalized recommendations retrieved' });
});
