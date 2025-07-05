import type { Config } from 'drizzle-kit';

export default {
    schema: './db/schema',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cruso',
    },
} satisfies Config;
