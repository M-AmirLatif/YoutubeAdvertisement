import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { makeReferralCode } from '../utils/youtube.js';

dotenv.config();

const [, , emailArg, passwordArg, usernameArg] = process.argv;
const email = String(emailArg || 'admin@example.com').toLowerCase();
const password = String(passwordArg || 'admin123');
const username = usernameArg || 'Admin';

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/youtube-advertisement', {
    serverSelectionTimeoutMS: 5000
  });

  let user = await User.findOne({ email });
  if (user) {
    user.role = 'admin';
    user.isOwner = true;
    if (passwordArg) user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    console.log(`Promoted admin: ${email}`);
  } else {
    user = await User.create({
      username,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin',
      isOwner: true,
      referralCode: makeReferralCode(username)
    });
    console.log(`Created admin: ${email}`);
  }

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
