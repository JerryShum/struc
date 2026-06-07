export interface User {
   id: number;
   email: string;
   created_at: string;
}

export interface Habit {
   id: number;
   user_id: number;
   name: string;
   description?: string;
   created_at: string;
}

export interface Checkin {
   id: number;
   habit_id: number;
   user_id: number;
   checkin_date: string;
   created_at: string;
}

export interface HabitWithStats extends Habit {
   streak: number;
   last_checkin_date?: string;
   total_checkins: number;
}
