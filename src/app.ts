import express from 'express';
import authRoutes from './routes/authRoutes';
import modelRoutes from './routes/modelRoutes';
import walletRoutes from './routes/walletRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
