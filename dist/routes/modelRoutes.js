"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const modelController_1 = require("../controllers/modelController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, (0, auth_1.requireRole)('admin', 'user', 'viewer'), modelController_1.modelController.listModels);
router.post('/:modelId/generate', auth_1.authenticate, (0, auth_1.requireRole)('admin', 'user'), modelController_1.modelController.generate);
exports.default = router;
