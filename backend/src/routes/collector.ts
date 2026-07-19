import { Router } from 'express';
import { toggleAvailability, listPendingJobs, acceptJob, rejectJob, pickupJob, getCollectorStats } from '../controllers/collectorController';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(['collector']));

router.put('/availability', toggleAvailability);
router.get('/jobs/pending', listPendingJobs);
router.put('/jobs/:id/accept', acceptJob);
router.put('/jobs/:id/reject', rejectJob);
router.put('/jobs/:id/pickup', upload.single('pickupProofImage'), pickupJob);
router.get('/stats', getCollectorStats);

export default router;
