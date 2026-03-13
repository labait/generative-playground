"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelService = void 0;
const store_1 = require("../store");
const walletService_1 = require("./walletService");
const mockTextResponses = [
    'The quick brown fox jumps over the lazy dog in a world where AI rewrites history.',
    'In the vast expanse of digital consciousness, data flows like rivers of light.',
    'Once upon a time, in a land of silicon dreams, a neural network learned to dream.',
];
const mockImageDescriptions = [
    'A vibrant oil painting of a futuristic cityscape at dusk, with neon lights reflecting off wet streets.',
    'A photorealistic rendering of a majestic mountain range with aurora borealis in the night sky.',
    'An abstract digital artwork featuring cascading geometric shapes in shades of blue and gold.',
];
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function mockGenerate(model, prompt) {
    if (model.type === 'text') {
        return `[${model.name}] Response to "${prompt}": ${pickRandom(mockTextResponses)}`;
    }
    else {
        return `[${model.name}] Image generated for "${prompt}": ${pickRandom(mockImageDescriptions)}`;
    }
}
exports.modelService = {
    listModels() {
        return store_1.models;
    },
    getModel(modelId) {
        return store_1.models.find(m => m.id === modelId);
    },
    async generate(userId, modelId, request) {
        const model = this.getModel(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        const remainingCredits = walletService_1.walletService.deductCredits(userId, model.costPerUse);
        const output = mockGenerate(model, request.prompt);
        return {
            modelId: model.id,
            type: model.type,
            prompt: request.prompt,
            output,
            creditsUsed: model.costPerUse,
            remainingCredits,
        };
    },
};
