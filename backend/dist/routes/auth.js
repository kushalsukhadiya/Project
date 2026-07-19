"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
// Public routes
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
// Private profile routes
router.get('/me', auth_1.authenticateToken, authController_1.getMe);
router.put('/profile', auth_1.authenticateToken, authController_1.updateProfile);
// Get all active recycling centers
router.get('/recyclers', auth_1.authenticateToken, async (req, res) => {
    try {
        const recyclers = await User_1.default.find({ role: 'recycler' })
            .select('name email phoneNumber city area recyclerDetails');
        res.json(recyclers);
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving recycling centers.', error: error.message });
    }
});
// Public leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await User_1.default.find({ role: 'citizen' })
            .select('name rewards profilePicture area city')
            .sort({ 'rewards.points': -1 })
            .limit(10);
        res.json(leaderboard);
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving leaderboard.', error: error.message });
    }
});
exports.default = router;
