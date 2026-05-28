import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/user.model';

async function promoteAdmin() {
  await mongoose.connect(process.env.MONGODB_URI!);
  
  const user = await User.findOneAndUpdate(
    { email: 'admin@flexauth.dev' },
    { $set: { roles: ['user', 'admin'] } },
    { new: true }
  );

  if (user) {
    console.log(`Promoted ${user.email} to admin. Roles: ${user.roles}`);
  } else {
    console.log('User not found');
  }

  await mongoose.disconnect();
}

promoteAdmin();
