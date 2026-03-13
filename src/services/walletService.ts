import { wallets } from '../store';
import { Wallet } from '../models/types';

export const walletService = {
  getWallet(userId: string): Wallet {
    const wallet = wallets.get(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    return wallet;
  },

  deductCredits(userId: string, amount: number): number {
    const wallet = this.getWallet(userId);
    if (wallet.credits < amount) {
      throw new Error('Insufficient credits');
    }
    wallet.credits -= amount;
    wallets.set(userId, wallet);
    return wallet.credits;
  },

  addCredits(userId: string, amount: number): number {
    const wallet = wallets.get(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    wallet.credits += amount;
    wallets.set(userId, wallet);
    return wallet.credits;
  },
};
