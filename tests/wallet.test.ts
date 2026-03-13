import request from 'supertest';
import app from '../src/app';
import { users, wallets } from '../src/store';

beforeEach(() => {
  users.clear();
  wallets.clear();
});

async function registerAndLogin(username: string, password: string) {
  const res = await request(app).post('/api/auth/register').send({ username, password });
  return res.body.token as string;
}

describe('GET /api/wallet', () => {
  it('returns wallet for authenticated user', async () => {
    const token = await registerAndLogin('alice', 'pass');
    const res = await request(app).get('/api/wallet').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.credits).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/wallet');
    expect(res.status).toBe(401);
  });
});

describe('Wallet top-up', () => {
  it('admin can top up user wallet', async () => {
    const adminToken = await registerAndLogin('admin', 'pass');
    const userRes = await request(app).post('/api/auth/register').send({ username: 'user1', password: 'pass' });
    const userId = userRes.body.user.id;

    const res = await request(app)
      .post(`/api/admin/users/${userId}/wallet/topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 50 });

    expect(res.status).toBe(200);
    expect(res.body.credits).toBeGreaterThanOrEqual(150); // 100 + 50
  });

  it('rejects invalid top-up amount', async () => {
    const adminToken = await registerAndLogin('admin', 'pass');
    const userRes = await request(app).post('/api/auth/register').send({ username: 'user1', password: 'pass' });
    const userId = userRes.body.user.id;

    const res = await request(app)
      .post(`/api/admin/users/${userId}/wallet/topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: -10 });

    expect(res.status).toBe(400);
  });
});

describe('Insufficient credits', () => {
  it('returns 402 when user has no credits', async () => {
    await registerAndLogin('admin', 'pass');
    const userToken = await registerAndLogin('pooruser', 'pass');

    // User starts with 100 credits. Use 50-credit model twice = 100 total, then third fails
    await request(app)
      .post('/api/models/dalle-image-advanced/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ prompt: 'test' });
    await request(app)
      .post('/api/models/dalle-image-advanced/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ prompt: 'test' });

    // Now at 0 credits
    const res = await request(app)
      .post('/api/models/dalle-image-advanced/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ prompt: 'test' });

    expect(res.status).toBe(402);
  });
});
