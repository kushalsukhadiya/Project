import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';

const router = Router();

router.use(authenticateToken);

// GET all notifications for logged-in user
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // limit to recent 50
      
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving notifications.', error: error.message });
  }
});

// PUT mark single notification as read
router.put('/:id/read', async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found or access denied.' });
    }
    
    res.json(notif);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating notification.', error: error.message });
  }
});

// PUT mark all user notifications as read
router.put('/read-all', async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error marking all notifications read.', error: error.message });
  }
});

export default router;
