import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export type AuthVariables = {
  userId: number;
  email: string;
};

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: Missing or invalid authorization header format (use Bearer <token>)' }, 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return c.json({ error: 'Unauthorized: Token not provided' }, 401);
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-key-1234567890';
    
    const payload = await verify(token, JWT_SECRET, 'HS256');
    
    if (!payload || typeof payload.userId !== 'number') {
      return c.json({ error: 'Unauthorized: Invalid token payload structure' }, 401);
    }

    // Set the authenticated user variables in context
    c.set('userId', payload.userId);
    c.set('email', payload.email as string);
    
    await next();
  } catch (error) {
    // verify() throws if the token is invalid or expired
    return c.json({ error: 'Unauthorized: Token is expired or invalid' }, 401);
  }
});
