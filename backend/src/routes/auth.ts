import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const auth = new Hono();

// Secret key for signing the JWT (loaded from environment)
const JWT_SECRET =
   process.env.JWT_SECRET || 'fallback-dev-secret-key-1234567890';

// Expiry time: 24 hours in seconds
const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60;

auth.post('/signup', async (c) => {
   try {
      const { email, password } = await c.req.json();

      // 1. Check for missing fields
      if (!email || !password) {
         return c.json({ error: 'Email and password are required' }, 400);
      }

      // 2. Validate email format (simple regex check)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         return c.json({ error: 'Invalid email address format' }, 400);
      }

      // 3. Password strength validation
      if (password.length < 8) {
         return c.json(
            { error: 'Password must be at least 8 characters long' },
            400,
         );
      }
      if (!/[A-Za-z]/.test(password)) {
         return c.json(
            { error: 'Password must contain at least one letter' },
            400,
         );
      }
      if (!/\d/.test(password)) {
         return c.json(
            { error: 'Password must contain at least one number' },
            400,
         );
      }

      const normalizedEmail = email.toLowerCase().trim();

      // 4. Check if user already exists
      const [existingUser] = await db
         .select()
         .from(users)
         .where(eq(users.email, normalizedEmail))
         .limit(1);

      if (existingUser) {
         return c.json({ error: 'Email already registered' }, 400);
      }

      // 5. Hash password with salt and save new user to DB
      const passwordHash = await bcrypt.hash(password, 10);
      const [newUser] = await db
         .insert(users)
         .values({
            email: normalizedEmail,
            passwordHash,
         })
         .returning({
            id: users.id,
            email: users.email,
            createdAt: users.createdAt,
         });

      // 6. Sign JWT token
      const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS;
      const token = await sign(
         { userId: newUser.id, email: newUser.email, exp },
         JWT_SECRET,
      );

      return c.json(
         {
            user: newUser,
            token,
         },
         201,
      );
   } catch (error) {
      console.error('Error during signup:', error);
      return c.json(
         { error: 'Failed to register user due to an internal error' },
         500,
      );
   }
});

auth.post('/login', async (c) => {
   try {
      const { email, password } = await c.req.json();

      // 1. Check for missing fields
      if (!email || !password) {
         return c.json({ error: 'Email and password are required' }, 400);
      }

      const normalizedEmail = email.toLowerCase().trim();

      // 2. Fetch user from DB
      const [user] = await db
         .select()
         .from(users)
         .where(eq(users.email, normalizedEmail))
         .limit(1);

      if (!user) {
         return c.json({ error: 'Invalid email or password' }, 401);
      }

      // 3. Compare password hashes
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
         return c.json({ error: 'Invalid email or password' }, 401);
      }

      // 4. Sign JWT token
      const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS;
      const token = await sign(
         { userId: user.id, email: user.email, exp },
         JWT_SECRET,
      );

      return c.json({
         user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
         },
         token,
      });
   } catch (error) {
      console.error('Error during login:', error);
      return c.json(
         { error: 'Failed to log in due to an internal error' },
         500,
      );
   }
});

export default auth;
