// Middleware factory: validates req.body against a Joi schema
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const messages = error.details.map((detail) => detail.message);
            return res.status(400).json({
                success: false,
                data: null,
                message: messages.join('; '),
            });
        }

        // Replace body with sanitized/validated values
        req.body = value;
        next();
    };
};

module.exports = validate;
