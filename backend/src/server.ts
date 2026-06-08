import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { runMigrations } from './db/migrate';

const app = new Hono();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date() }));

const port = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  try {
    // Run database migrations programmatically at startup
    await runMigrations();
    
    console.log(`🚀 Server running on http://localhost:${port}`);
    serve({ fetch: app.fetch, port });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
