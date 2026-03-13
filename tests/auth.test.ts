import request from 'supertest';
import app from '../src/app';
import { users, wallets } from '../src/store';

beforeEach(() => {
  users.clear();
  wallets.clear();
});

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'alice', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('alice');
    expect(res.body.user.role).toBe('admin'); // first user is admin
  });

  it('second user gets user role', async () => {
    await request(app).post('/api/auth/register').send({ username: 'alice', password: 'pass' });
    const res = await request(app).post('/api/auth/register').send({ username: 'bob', password: 'pass' });
    expect(res.body.user.role).toBe('user');
  });

  it('rejects duplicate username', async () => {
    await request(app).post('/api/auth/register').send({ username: 'alice', password: 'pass' });
    const res = await request(app).post('/api/auth/register').send({ username: 'alice', password: 'pass2' });
    expect(res.status).toBe(409);
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'alice' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({ username: 'alice', password: 'password123' });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'alice', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'alice', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown user', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'pass' });
    expect(res.status).toBe(401);
  });
});
