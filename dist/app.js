"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const modelRoutes_1 = __importDefault(require("./routes/modelRoutes"));
const walletRoutes_1 = __importDefault(require("./routes/walletRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.default);
app.use('/api/models', modelRoutes_1.default);
app.use('/api/wallet', walletRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
exports.default = app;
