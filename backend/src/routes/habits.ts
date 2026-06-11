import { Hono } from 'hono';
import { db } from '../db/index.js';
import { habits } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';

const habitsRouter = new Hono<{ Variables: AuthVariables }>();

// Require authentication for all habits routes
habitsRouter.use('*', requireAuth);

// GET /habits - list all habits for the authenticated user
habitsRouter.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const userHabits = await db
      .select()
      .from(habits)
      .where(eq(habits.userId, userId));

    const formattedHabits = userHabits.map((h) => ({
      id: h.id,
      user_id: h.userId,
      name: h.name,
      description: h.description ?? undefined,
      created_at: h.createdAt.toISOString(),
    }));

    return c.json(formattedHabits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return c.json({ error: 'Failed to fetch habits' }, 500);
  }
});

// POST /habits - create a new habit for the authenticated user
habitsRouter.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return c.json({ error: 'Name is required' }, 400);
    }

    const [newHabit] = await db
      .insert(habits)
      .values({
        userId,
        name: name.trim(),
        description: description ? description.trim() : null,
      })
      .returning();

    const formattedHabit = {
      id: newHabit.id,
      user_id: newHabit.userId,
      name: newHabit.name,
      description: newHabit.description ?? undefined,
      created_at: newHabit.createdAt.toISOString(),
    };

    return c.json(formattedHabit, 201);
  } catch (error) {
    console.error('Error creating habit:', error);
    return c.json({ error: 'Failed to create habit' }, 500);
  }
});

export default habitsRouter;
