import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { walletService } from '../services/walletService';

export const walletController = {
  getWallet(req: AuthRequest, res: Response): void {
    try {
      const wallet = walletService.getWallet(req.user!.userId);
      res.status(200).json(wallet);
    } catch (_err) {
      res.status(404).json({ error: 'Wallet not found' });
    }
  },
};
