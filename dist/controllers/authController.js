"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const authService_1 = require("../services/authService");
exports.authController = {
    async register(req, res) {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        try {
            const result = await authService_1.authService.register(username, password);
            res.status(201).json(result);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            res.status(409).json({ error: message });
        }
    },
    async login(req, res) {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        try {
            const result = await authService_1.authService.login(username, password);
            res.status(200).json(result);
        }
        catch (_err) {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    },
};
