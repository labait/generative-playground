"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletService = void 0;
const store_1 = require("../store");
exports.walletService = {
    getWallet(userId) {
        const wallet = store_1.wallets.get(userId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        return wallet;
    },
    deductCredits(userId, amount) {
        const wallet = this.getWallet(userId);
        if (wallet.credits < amount) {
            throw new Error('Insufficient credits');
        }
        wallet.credits -= amount;
        store_1.wallets.set(userId, wallet);
        return wallet.credits;
    },
    addCredits(userId, amount) {
        const wallet = store_1.wallets.get(userId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        wallet.credits += amount;
        store_1.wallets.set(userId, wallet);
        return wallet.credits;
    },
};
