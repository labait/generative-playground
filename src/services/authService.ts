import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { users, wallets } from '../store';
import { config } from '../config';
import { User, Role, JwtPayload } from '../models/types';

export const authService = {
  async register(username: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    if ([...users.values()].find(u => u.username === username)) {
      throw new Error('Username already exists');
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const role: Role = users.size === 0 ? 'admin' : 'user';
    const id = uuidv4();

    const user: User = {
      id,
      username,
      passwordHash,
      role,
      createdAt: new Date(),
    };

    users.set(id, user);
    wallets.set(id, {
      userId: id,
      credits: role === 'admin' ? config.initialAdminCredits : config.initialUserCredits,
    });

    const payload: JwtPayload = { userId: id, username, role };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async login(username: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const user = [...users.values()].find(u => u.username === username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const payload: JwtPayload = { userId: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },
};
