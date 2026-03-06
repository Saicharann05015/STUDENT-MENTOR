const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/env');
const logger = require('../utils/logger');

class AuthService {
    // Generate JWT token
    static generateToken(userId) {
        return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
    }

    // Register new user
    static async register({ name, email, password }) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw Object.assign(new Error('Email already registered'), { statusCode: 400 });
        }

        const user = await User.create({ name, email, password, isVerified: true });
        const token = this.generateToken(user._id);

        return {
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token,
        };
    }

    // Login user
    static async login({ email, password }) {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
        }

        // Check if user has verified their email
        if (!user.isVerified) {
            throw Object.assign(new Error('Please verify your email before logging in'), { statusCode: 403 });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
        }

        const token = this.generateToken(user._id);

        return {
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token,
        };
    }

    // Get current user profile
    static async getMe(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        }
        return user;
    }

    // Forgot password — send reset email
    static async forgotPassword(email, resetBaseUrl) {
        const user = await User.findOne({ email });
        if (!user) {
            throw Object.assign(new Error('No account found with that email'), { statusCode: 404 });
        }

        // Generate reset token
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        // Build reset URL
        const resetUrl = `${resetBaseUrl}/reset-password?token=${resetToken}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #7c3aed;">Student Mentor — Password Reset</h2>
                <p>Hi <strong>${user.name}</strong>,</p>
                <p>You requested a password reset. Click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background: #7c3aed; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #888; font-size: 14px;">This link expires in <strong>15 minutes</strong>.</p>
                <p style="color: #888; font-size: 14px;">If you didn't request this, ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #aaa; font-size: 12px;">— Student Mentor Team</p>
            </div>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset — Student Mentor',
                html,
            });
            return { message: 'Password reset email sent' };
        } catch (error) {
            // Clear reset token if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            logger.error(`Password reset email failed: ${error.message}`);
            throw Object.assign(new Error('Email could not be sent. Please try again later.'), {
                statusCode: 500,
            });
        }
    }

    // Reset password with token
    static async resetPassword(token, newPassword) {
        // Hash the token to match stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            throw Object.assign(
                new Error('Invalid or expired reset token. Please request a new one.'),
                { statusCode: 400 }
            );
        }

        // Set new password and clear reset fields
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return { message: 'Password reset successful. You can now log in.' };
    }
}

module.exports = AuthService;
