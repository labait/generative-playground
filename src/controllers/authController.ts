import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }
    try {
      const result = await authService.register(username, password);
      res.status(201).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      res.status(409).json({ error: message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }
    try {
      const result = await authService.login(username, password);
      res.status(200).json(result);
    } catch (_err) {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  },
};
