import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import User from '../models/User';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Private profile routes
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

// Get all active recycling centers
router.get('/recyclers', authenticateToken, async (req, res) => {
  try {
    const recyclers = await User.find({ role: 'recycler' })
      .select('name email phoneNumber city area recyclerDetails');
    res.json(recyclers);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving recycling centers.', error: error.message });
  }
});

// Public leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'citizen' })
      .select('name rewards profilePicture area city')
      .sort({ 'rewards.points': -1 })
      .limit(10);
    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving leaderboard.', error: error.message });
  }
});

export default router;
