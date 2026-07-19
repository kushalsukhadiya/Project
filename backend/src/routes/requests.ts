import { Router } from 'express';
import { createRequest, classifyImage, listMyRequests, getRequestById, cancelRequest, rateRequest } from '../controllers/requestController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Apply auth middleware to all requests routes
router.use(authenticateToken);

router.post('/', upload.array('images', 5), createRequest);
router.post('/classify-image', upload.single('image'), classifyImage);
router.get('/my', listMyRequests);
router.get('/:id', getRequestById);
router.put('/:id/cancel', cancelRequest);
router.post('/:id/feedback', rateRequest);

export default router;
