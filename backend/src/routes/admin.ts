import { Router } from 'express';
import { getAnalytics, listUsers, deleteUser, verifyRequest, listFeedback } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';
import PlasticRequest from '../models/PlasticRequest';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(['admin']));

router.get('/analytics', getAnalytics);
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);
router.put('/requests/:id/verify', verifyRequest);
router.get('/feedback', listFeedback);

// General admin route to get all requests in the system
router.get('/requests', async (req, res) => {
  try {
    const requests = await PlasticRequest.find({})
      .populate('citizen', 'name email')
      .populate('collector', 'name email')
      .populate('recyclingCenter', 'name recyclerDetails')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving all requests.', error: error.message });
  }
});

export default router;
