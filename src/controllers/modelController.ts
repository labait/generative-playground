import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { modelService } from '../services/modelService';

export const modelController = {
  listModels(_req: AuthRequest, res: Response): void {
    const models = modelService.listModels();
    res.status(200).json({ models });
  },

  async generate(req: AuthRequest, res: Response): Promise<void> {
    const { modelId } = req.params;
    const { prompt, options } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const model = modelService.getModel(modelId);
    if (!model) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }

    try {
      const result = await modelService.generate(req.user!.userId, modelId, { prompt, options });
      res.status(200).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      if (message === 'Insufficient credits') {
        res.status(402).json({ error: 'Insufficient credits' });
        return;
      }
      res.status(500).json({ error: message });
    }
  },
};
