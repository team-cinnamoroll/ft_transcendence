import { describe, expect, it } from 'vitest';
import app from '../src/index';

describe('Hono backend', () => {
  it('GET /hello returns expected JSON', async () => {
    const res = await app.request('/hello');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      message: 'Hello from Hono!',
    });
  });
});
