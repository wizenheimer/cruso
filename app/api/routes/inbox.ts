import { Hono } from 'hono';
import { handleInboxWebhook } from '@/app/api/handlers/inbox';

const inbox = new Hono();

const webhookPath = process.env.WEBHOOK_PATH || 'webhook';

inbox.post(webhookPath, handleInboxWebhook);

export default inbox;
