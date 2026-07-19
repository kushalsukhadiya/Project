import { Router } from 'express';
import { listShipments, confirmReceipt, updateRecyclingStatus, getRecyclerStats } from '../controllers/recyclerController';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(['recycler']));

router.get('/shipments', listShipments);
router.put('/shipments/:id/receive', confirmReceipt);
router.put('/shipments/:id/recycle', updateRecyclingStatus);
router.get('/stats', getRecyclerStats);

export default router;
