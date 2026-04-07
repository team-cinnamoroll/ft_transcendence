import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();
const _route = app.get('/hello', (c) => {
  return c.json({ message: 'Hello from Hono!' });
});

export type AppType = typeof _route;
export default app;

if (import.meta.env?.PROD) {
  const port = Number(process.env.PORT ?? 8000);
  serve({ fetch: app.fetch, port });
}
