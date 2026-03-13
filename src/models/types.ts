export type Role = 'admin' | 'user' | 'viewer';
export type ModelType = 'text' | 'image';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export interface Wallet {
  userId: string;
  credits: number;
}

export interface GenerativeModel {
  id: string;
  name: string;
  type: ModelType;
  description: string;
  costPerUse: number;
}

export interface GenerationRequest {
  prompt: string;
  options?: Record<string, unknown>;
}

export interface GenerationResult {
  modelId: string;
  type: ModelType;
  prompt: string;
  output: string;
  creditsUsed: number;
  remainingCredits: number;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: Role;
}
