const AuthService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Register user
// @route   POST /api/v1/auth/register
exports.register = asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);
    ApiResponse.created(res, { data: result, message: 'Account created successfully. Please log in.' });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body);
    ApiResponse.success(res, { data: result, message: 'Login successful' });
});

// @desc    Get current logged-in user
// @route   GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res) => {
    const user = await AuthService.getMe(req.user.id);
    ApiResponse.success(res, { data: user, message: 'User profile retrieved' });
});

// @desc    Forgot password — send reset email
// @route   POST /api/v1/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
    const resetBaseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const result = await AuthService.forgotPassword(req.body.email, resetBaseUrl);
    ApiResponse.success(res, { data: null, message: result.message });
});

// @desc    Reset password with token
// @route   PUT /api/v1/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res) => {
    const result = await AuthService.resetPassword(req.params.token, req.body.password);
    ApiResponse.success(res, { data: null, message: result.message });
});
