"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletController = void 0;
const walletService_1 = require("../services/walletService");
exports.walletController = {
    getWallet(req, res) {
        try {
            const wallet = walletService_1.walletService.getWallet(req.user.userId);
            res.status(200).json(wallet);
        }
        catch (_err) {
            res.status(404).json({ error: 'Wallet not found' });
        }
    },
};
