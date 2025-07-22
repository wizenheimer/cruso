import { Hono } from 'hono';
import connections from './connections';
import sync from './sync';

const calendar = new Hono();

// Mount all route modules
calendar.route('/', connections);
calendar.route('/sync', sync);

export default calendar;
