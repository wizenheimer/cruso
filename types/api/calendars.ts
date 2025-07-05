import { calendarConnections, insertCalendarConnectionSchema } from '@/db/schema/calendars';

export const ConnectCalendarSchema = insertCalendarConnectionSchema.omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
});

export type CalendarConnection = typeof calendarConnections.$inferSelect;
export type InsertCalendarConnection = typeof calendarConnections.$inferInsert;
