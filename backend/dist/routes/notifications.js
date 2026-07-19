"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Notification_1 = __importDefault(require("../models/Notification"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
// GET all notifications for logged-in user
router.get('/', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const notifications = await Notification_1.default.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50); // limit to recent 50
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving notifications.', error: error.message });
    }
});
// PUT mark single notification as read
router.put('/:id/read', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const notif = await Notification_1.default.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true }, { new: true });
        if (!notif) {
            return res.status(404).json({ message: 'Notification not found or access denied.' });
        }
        res.json(notif);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating notification.', error: error.message });
    }
});
// PUT mark all user notifications as read
router.put('/read-all', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        await Notification_1.default.updateMany({ user: req.user.id, read: false }, { read: true });
        res.json({ message: 'All notifications marked as read.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error marking all notifications read.', error: error.message });
    }
});
exports.default = router;
