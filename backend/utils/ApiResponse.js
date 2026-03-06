// Standardized API response utility
// Ensures all responses follow: { success, data, message }

class ApiResponse {
    static success(res, { data = {}, message = 'Success', statusCode = 200 } = {}) {
        return res.status(statusCode).json({
            success: true,
            data,
            message,
        });
    }

    static created(res, { data = {}, message = 'Created successfully' } = {}) {
        return res.status(201).json({
            success: true,
            data,
            message,
        });
    }

    static error(res, { message = 'Something went wrong', statusCode = 500, data = null } = {}) {
        return res.status(statusCode).json({
            success: false,
            data,
            message,
        });
    }
}

module.exports = ApiResponse;
