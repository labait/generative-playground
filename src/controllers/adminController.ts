import { Request, Response } from 'express';
import { adminService } from '../services/adminService';
import { Role } from '../models/types';

export const adminController = {
  listUsers(_req: Request, res: Response): void {
    const users = adminService.listUsers();
    res.status(200).json({ users });
  },

  updateRole(req: Request, res: Response): void {
    const { userId } = req.params;
    const { role } = req.body;
    const validRoles: Role[] = ['admin', 'user', 'viewer'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    try {
      const user = adminService.updateUserRole(userId, role);
      res.status(200).json(user);
    } catch (_err) {
      res.status(404).json({ error: 'User not found' });
    }
  },

  topUpWallet(req: Request, res: Response): void {
    const { userId } = req.params;
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }
    try {
      const wallet = adminService.topUpWallet(userId, amount);
      res.status(200).json(wallet);
    } catch (_err) {
      res.status(404).json({ error: 'User not found' });
    }
  },
};
