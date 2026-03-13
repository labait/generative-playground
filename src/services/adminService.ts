import { users, wallets } from '../store';
import { walletService } from './walletService';
import { User, Role, Wallet } from '../models/types';

export const adminService = {
  listUsers(): Array<Omit<User, 'passwordHash'> & { wallet: Wallet }> {
    return [...users.values()].map(user => {
      const { passwordHash: _, ...safeUser } = user;
      const wallet = wallets.get(user.id) || { userId: user.id, credits: 0 };
      return { ...safeUser, wallet };
    });
  },

  updateUserRole(userId: string, role: Role): Omit<User, 'passwordHash'> {
    const user = users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.role = role;
    users.set(userId, user);
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },

  topUpWallet(userId: string, amount: number): Wallet {
    if (!users.has(userId)) {
      throw new Error('User not found');
    }
    walletService.addCredits(userId, amount);
    return wallets.get(userId)!;
  },
};
