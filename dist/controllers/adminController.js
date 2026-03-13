"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const adminService_1 = require("../services/adminService");
exports.adminController = {
    listUsers(_req, res) {
        const users = adminService_1.adminService.listUsers();
        res.status(200).json({ users });
    },
    updateRole(req, res) {
        const { userId } = req.params;
        const { role } = req.body;
        const validRoles = ['admin', 'user', 'viewer'];
        if (!validRoles.includes(role)) {
            res.status(400).json({ error: 'Invalid role' });
            return;
        }
        try {
            const user = adminService_1.adminService.updateUserRole(userId, role);
            res.status(200).json(user);
        }
        catch (_err) {
            res.status(404).json({ error: 'User not found' });
        }
    },
    topUpWallet(req, res) {
        const { userId } = req.params;
        const { amount } = req.body;
        if (typeof amount !== 'number' || amount <= 0) {
            res.status(400).json({ error: 'Amount must be a positive number' });
            return;
        }
        try {
            const wallet = adminService_1.adminService.topUpWallet(userId, amount);
            res.status(200).json(wallet);
        }
        catch (_err) {
            res.status(404).json({ error: 'User not found' });
        }
    },
};
