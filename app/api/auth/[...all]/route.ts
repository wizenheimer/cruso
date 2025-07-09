// app/api/auth/[...all]/route.ts

import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

/**
 * The GET and POST handlers
 */
export const { GET, POST } = toNextJsHandler(auth);
