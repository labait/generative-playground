import request from 'supertest';
import app from '../src/app';
import { users, wallets } from '../src/store';

beforeEach(() => {
  users.clear();
  wallets.clear();
});

async function register(username: string, password: string) {
  const res = await request(app).post('/api/auth/register').send({ username, password });
  return { token: res.body.token as string, userId: res.body.user.id as string };
}

describe('Admin endpoints', () => {
  it('admin can access /api/admin/users', async () => {
    const { token } = await register('admin', 'pass');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('user cannot access /api/admin/users', async () => {
    await register('admin', 'pass');
    const { token } = await register('user1', 'pass');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('admin can update user role', async () => {
    const { token: adminToken } = await register('admin', 'pass');
    const { userId } = await register('user1', 'pass');

    const res = await request(app)
      .put(`/api/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'viewer' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('viewer');
  });
});

describe('Viewer role restrictions', () => {
  it('viewer can list models', async () => {
    const { token: adminToken } = await register('admin', 'pass');
    const { userId } = await register('user1', 'pass');

    await request(app)
      .put(`/api/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'viewer' });

    const loginRes = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'pass' });
    const viewerToken = loginRes.body.token;

    const res = await request(app).get('/api/models').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
  });

  it('viewer cannot generate', async () => {
    const { token: adminToken } = await register('admin', 'pass');
    const { userId } = await register('user1', 'pass');

    await request(app)
      .put(`/api/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'viewer' });

    const loginRes = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'pass' });
    const viewerToken = loginRes.body.token;

    const res = await request(app)
      .post('/api/models/gpt-text-basic/generate')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ prompt: 'test' });
    expect(res.status).toBe(403);
  });
});

describe('Unauthenticated requests', () => {
  it('returns 401 for protected routes', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });
});
