// app/api/auth/[...all]/route.ts

import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

/**
 * Force Node.js runtime to support googleapis and other Node.js modules
 */
export const runtime = 'nodejs';

/**
 * The GET and POST handlers
 */
export const { GET, POST } = toNextJsHandler(auth);
