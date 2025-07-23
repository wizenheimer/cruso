import { relations } from 'drizzle-orm';
import { user, account, session } from './auth';
import { workingHours } from './working-hours';

/**
 * User relations - defines one-to-many relationships
 */
export const userRelations = relations(user, ({ many }) => ({
    workingHours: many(workingHours),
    accounts: many(account),
    sessions: many(session),
}));

/**
 * Account relations
 */
export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

/**
 * Session relations
 */
export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));
