import { models } from '../store';
import { walletService } from './walletService';
import { GenerationRequest, GenerationResult, GenerativeModel } from '../models/types';

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

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mockGenerate(model: GenerativeModel, prompt: string): string {
  if (model.type === 'text') {
    return `[${model.name}] Response to "${prompt}": ${pickRandom(mockTextResponses)}`;
  } else {
    return `[${model.name}] Image generated for "${prompt}": ${pickRandom(mockImageDescriptions)}`;
  }
}

export const modelService = {
  listModels(): GenerativeModel[] {
    return models;
  },

  getModel(modelId: string): GenerativeModel | undefined {
    return models.find(m => m.id === modelId);
  },

  async generate(userId: string, modelId: string, request: GenerationRequest): Promise<GenerationResult> {
    const model = this.getModel(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    const remainingCredits = walletService.deductCredits(userId, model.costPerUse);

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
