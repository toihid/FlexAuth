import 'dotenv/config';
import mongoose from 'mongoose';
import { AdminConfig } from '../models/admin-config.model';

async function disableOAuth() {
  await mongoose.connect(process.env.MONGODB_URI!);
  
  const config = await AdminConfig.findOne();
  if (config) {
    config.providers.forEach((p) => {
      if (p.type !== 'local') {
        p.enabled = false;
      }
    });
    await config.save();
    console.log('Disabled all OAuth providers. Only local login is active.');
  }

  await mongoose.disconnect();
}

disableOAuth();
