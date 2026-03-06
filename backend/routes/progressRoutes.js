const express = require('express');
const router = express.Router();
const {
    getUserProgress,
    logActivity,
    updateStreak,
    addStudyTime,
    getActivityHistory,
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { logActivitySchema, addStudyTimeSchema } = require('../middleware/validators');

router.use(protect);

router.get('/', getUserProgress);
router.post('/activity', validate(logActivitySchema), logActivity);
router.put('/streak', updateStreak);
router.put('/study-time', validate(addStudyTimeSchema), addStudyTime);
router.get('/activities', getActivityHistory);

module.exports = router;
