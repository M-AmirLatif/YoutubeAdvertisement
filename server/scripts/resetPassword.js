import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const [, , emailArg, passwordArg] = process.argv;
const email = String(emailArg || '').toLowerCase();
const password = String(passwordArg || '');

async function run() {
  if (!email || password.length < 6) {
    throw new Error('Usage: npm run reset-password -- user@example.com new-password');
  }

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/youtube-advertisement', {
    serverSelectionTimeoutMS: 5000
  });

  const user = await User.findOne({ email });
  if (!user) throw new Error(`No user found for ${email}`);

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = '';
  user.passwordResetExpiresAt = null;
  await user.save();
  await mongoose.disconnect();

  console.log(`Password reset for ${email}`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
