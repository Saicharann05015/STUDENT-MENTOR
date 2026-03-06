const UserService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get user profile
// @route   GET /api/v1/users/profile
exports.getProfile = asyncHandler(async (req, res) => {
    const user = await UserService.getUserById(req.user.id);
    ApiResponse.success(res, { data: user, message: 'Profile retrieved' });
});

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
    const user = await UserService.updateProfile(req.user.id, req.body);
    ApiResponse.success(res, { data: user, message: 'Profile updated' });
});

// @desc    Delete user account
// @route   DELETE /api/v1/users/profile
exports.deleteAccount = asyncHandler(async (req, res) => {
    const result = await UserService.deleteUser(req.user.id);
    ApiResponse.success(res, { data: result, message: 'Account deleted' });
});

// @desc    Get all users (admin)
// @route   GET /api/v1/users
exports.getAllUsers = asyncHandler(async (req, res) => {
    const result = await UserService.getAllUsers(req.query);
    ApiResponse.success(res, { data: result, message: 'Users retrieved' });
});
