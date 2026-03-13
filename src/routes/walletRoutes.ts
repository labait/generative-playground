import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { walletController } from '../controllers/walletController';

const router = Router();
router.get('/', authenticate, walletController.getWallet);

export default router;
