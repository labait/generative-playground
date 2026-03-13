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

describe('GET /api/models', () => {
  it('returns all models for authenticated users', async () => {
    const token = await registerAndLogin('alice', 'pass');
    const res = await request(app).get('/api/models').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.models).toHaveLength(4);
  });

  it('includes model details', async () => {
    const token = await registerAndLogin('alice', 'pass');
    const res = await request(app).get('/api/models').set('Authorization', `Bearer ${token}`);
    const model = res.body.models.find((m: { id: string }) => m.id === 'gpt-text-basic');
    expect(model).toBeDefined();
    expect(model.costPerUse).toBe(10);
    expect(model.type).toBe('text');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/models');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/models/:modelId/generate', () => {
  it('generates text with text model', async () => {
    const token = await registerAndLogin('alice', 'pass');
    const res = await request(app)
      .post('/api/models/gpt-text-basic/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'Hello world' });

    expect(res.status).toBe(200);
    expect(res.body.output).toBeDefined();
    expect(res.body.creditsUsed).toBe(10);
    expect(res.body.type).toBe('text');
  });

  it('generates image with image model', async () => {
    const token = await registerAndLogin('alice', 'pass');
    const res = await request(app)
      .post('/api/models/dalle-image-basic/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'A sunset' });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('image');
    expect(res.body.creditsUsed).toBe(30);
  });

  it('deducts credits from wallet', async () => {
    const token = await registerAndLogin('alice', 'pass');
    const before = await request(app).get('/api/wallet').set('Authorization', `Bearer ${token}`);
    const initialCredits = before.body.credits;

    await request(app)
      .post('/api/models/gpt-text-basic/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'test' });

    const after = await request(app).get('/api/wallet').set('Authorization', `Bearer ${token}`);
    expect(after.body.credits).toBe(initialCredits - 10);
  });

  it('returns 404 for unknown model', async () => {
    const token = await registerAndLogin('alice', 'pass');
    const res = await request(app)
      .post('/api/models/unknown-model/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'test' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when prompt is missing', async () => {
    const token = await registerAndLogin('alice', 'pass');
    const res = await request(app)
      .post('/api/models/gpt-text-basic/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});
