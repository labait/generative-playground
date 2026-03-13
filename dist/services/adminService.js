"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
const store_1 = require("../store");
const walletService_1 = require("./walletService");
exports.adminService = {
    listUsers() {
        return [...store_1.users.values()].map(user => {
            const { passwordHash: _, ...safeUser } = user;
            const wallet = store_1.wallets.get(user.id) || { userId: user.id, credits: 0 };
            return { ...safeUser, wallet };
        });
    },
    updateUserRole(userId, role) {
        const user = store_1.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        user.role = role;
        store_1.users.set(userId, user);
        const { passwordHash: _, ...safeUser } = user;
        return safeUser;
    },
    topUpWallet(userId, amount) {
        if (!store_1.users.has(userId)) {
            throw new Error('User not found');
        }
        walletService_1.walletService.addCredits(userId, amount);
        return store_1.wallets.get(userId);
    },
};
