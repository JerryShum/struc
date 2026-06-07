import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date() }));

const port = parseInt(process.env.PORT || '3000', 10);
console.log(`🚀 Server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
