import type { SignOptions } from 'jsonwebtoken';

export const config = {
  jwtSecret: process.env.JWT_SECRET || 'generative-playground-secret-key',
  jwtExpiresIn: '24h' as SignOptions['expiresIn'],
  bcryptRounds: 10,
  port: parseInt(process.env.PORT || '3000', 10),
  initialAdminCredits: 10000,
  initialUserCredits: 100,
};
