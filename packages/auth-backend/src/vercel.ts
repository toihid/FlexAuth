import 'dotenv/config';
import { app } from './app';
import { connectDatabase } from './config/database';
import { seedAdminConfig } from './seeds/admin-config';

let isConnected = false;

async function ensureConnection() {
  if (!isConnected) {
    await connectDatabase();
    await seedAdminConfig();
    isConnected = true;
  }
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  await ensureConnection();
  return app(req, res);
}
