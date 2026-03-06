const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter once (singleton) — reuses SMTP connection pool
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
    const mailOptions = {
        from: `"Student Mentor" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    };

    try {
        const info = await getTransporter().sendMail(mailOptions);
        logger.info(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Email failed: ${error.message}`);
        throw new Error('Email could not be sent');
    }
};

module.exports = sendEmail;
