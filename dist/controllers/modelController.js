"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelController = void 0;
const modelService_1 = require("../services/modelService");
exports.modelController = {
    listModels(_req, res) {
        const models = modelService_1.modelService.listModels();
        res.status(200).json({ models });
    },
    async generate(req, res) {
        const { modelId } = req.params;
        const { prompt, options } = req.body;
        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }
        const model = modelService_1.modelService.getModel(modelId);
        if (!model) {
            res.status(404).json({ error: 'Model not found' });
            return;
        }
        try {
            const result = await modelService_1.modelService.generate(req.user.userId, modelId, { prompt, options });
            res.status(200).json(result);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Generation failed';
            if (message === 'Insufficient credits') {
                res.status(402).json({ error: 'Insufficient credits' });
                return;
            }
            res.status(500).json({ error: message });
        }
    },
};
