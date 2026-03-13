"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const store_1 = require("../store");
const config_1 = require("../config");
exports.authService = {
    async register(username, password) {
        if ([...store_1.users.values()].find(u => u.username === username)) {
            throw new Error('Username already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, config_1.config.bcryptRounds);
        const role = store_1.users.size === 0 ? 'admin' : 'user';
        const id = (0, uuid_1.v4)();
        const user = {
            id,
            username,
            passwordHash,
            role,
            createdAt: new Date(),
        };
        store_1.users.set(id, user);
        store_1.wallets.set(id, {
            userId: id,
            credits: role === 'admin' ? config_1.config.initialAdminCredits : config_1.config.initialUserCredits,
        });
        const payload = { userId: id, username, role };
        const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
        const { passwordHash: _, ...safeUser } = user;
        return { user: safeUser, token };
    },
    async login(username, password) {
        const user = [...store_1.users.values()].find(u => u.username === username);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            throw new Error('Invalid credentials');
        }
        const payload = { userId: user.id, username: user.username, role: user.role };
        const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
        const { passwordHash: _, ...safeUser } = user;
        return { user: safeUser, token };
    },
};
