"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    jwtSecret: process.env.JWT_SECRET || 'generative-playground-secret-key',
    jwtExpiresIn: '24h',
    bcryptRounds: 10,
    port: parseInt(process.env.PORT || '3000', 10),
    initialAdminCredits: 10000,
    initialUserCredits: 100,
};
