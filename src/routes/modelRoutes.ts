import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { modelController } from '../controllers/modelController';

const router = Router();
router.get('/', authenticate, requireRole('admin', 'user', 'viewer'), modelController.listModels);
router.post('/:modelId/generate', authenticate, requireRole('admin', 'user'), modelController.generate);

export default router;
