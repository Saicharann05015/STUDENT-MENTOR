const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    deleteAccount,
    getAllUsers,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfileSchema } = require('../middleware/validators');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.delete('/profile', deleteAccount);
router.get('/', authorize('admin'), getAllUsers);

module.exports = router;
