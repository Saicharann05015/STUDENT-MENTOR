const ProgressService = require('../services/progressService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get user progress dashboard
// @route   GET /api/v1/progress
exports.getUserProgress = asyncHandler(async (req, res) => {
    const progress = await ProgressService.getUserProgress(req.user.id);
    ApiResponse.success(res, { data: progress, message: 'Progress retrieved' });
});

// @desc    Log an activity
// @route   POST /api/v1/progress/activity
exports.logActivity = asyncHandler(async (req, res) => {
    const progress = await ProgressService.logActivity(req.user.id, req.body);
    ApiResponse.success(res, { data: progress, message: 'Activity logged' });
});

// @desc    Update streak
// @route   PUT /api/v1/progress/streak
exports.updateStreak = asyncHandler(async (req, res) => {
    const progress = await ProgressService.updateStreak(req.user.id);
    ApiResponse.success(res, { data: progress, message: 'Streak updated' });
});

// @desc    Add study time
// @route   PUT /api/v1/progress/study-time
exports.addStudyTime = asyncHandler(async (req, res) => {
    const progress = await ProgressService.addStudyTime(req.user.id, req.body.minutes);
    ApiResponse.success(res, { data: progress, message: 'Study time added' });
});

// @desc    Get activity history
// @route   GET /api/v1/progress/activities
exports.getActivityHistory = asyncHandler(async (req, res) => {
    const activities = await ProgressService.getActivityHistory(req.user.id, req.query);
    ApiResponse.success(res, { data: activities, message: 'Activity history retrieved' });
});
