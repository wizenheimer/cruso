import { Hono } from 'hono';
import connections from './connections';
import availability from './availability';
import events from './events';
import search from './search';
import sync from './sync';

const calendar = new Hono();

// Mount all route modules
calendar.route('/availability', availability);
calendar.route('/', connections);
calendar.route('/events', events);
calendar.route('/search', search);
calendar.route('/sync', sync);

export default calendar;
