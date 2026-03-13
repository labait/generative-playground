"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const walletController_1 = require("../controllers/walletController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, walletController_1.walletController.getWallet);
exports.default = router;
