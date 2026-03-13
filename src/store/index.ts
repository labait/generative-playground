import { User, Wallet, GenerativeModel } from '../models/types';

export const users = new Map<string, User>();
export const wallets = new Map<string, Wallet>();

export const models: GenerativeModel[] = [
  {
    id: 'gpt-text-basic',
    name: 'GPT Text Basic',
    type: 'text',
    description: 'Basic text generation model',
    costPerUse: 10,
  },
  {
    id: 'gpt-text-advanced',
    name: 'GPT Text Advanced',
    type: 'text',
    description: 'Advanced text generation model',
    costPerUse: 25,
  },
  {
    id: 'dalle-image-basic',
    name: 'DALL-E Image Basic',
    type: 'image',
    description: 'Basic image generation model',
    costPerUse: 30,
  },
  {
    id: 'dalle-image-advanced',
    name: 'DALL-E Image Advanced',
    type: 'image',
    description: 'Advanced image generation model',
    costPerUse: 50,
  },
];
