import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { adminController } from '../controllers/adminController';

const router = Router();
router.use(authenticate, requireRole('admin'));
router.get('/users', adminController.listUsers);
router.put('/users/:userId/role', adminController.updateRole);
router.post('/users/:userId/wallet/topup', adminController.topUpWallet);

export default router;
