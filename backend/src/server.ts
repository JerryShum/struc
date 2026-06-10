import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { runMigrations } from './db/migrate.js';
import authRouter from './routes/auth.js';
import { requireAuth, type AuthVariables } from './middleware/auth.js';

const app = new Hono<{ Variables: AuthVariables }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date() }));

// Mount auth endpoints
app.route('/auth', authRouter);

// Protected test endpoint to verify authorization middleware
app.get('/auth/me', requireAuth, (c) => {
  const userId = c.get('userId');
  const email = c.get('email');
  return c.json({
    message: 'Successfully authenticated',
    user: { id: userId, email },
  });
});

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
