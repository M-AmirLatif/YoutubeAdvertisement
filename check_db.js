import mongoose from 'mongoose';
import User from './server/models/User.js';
import bcrypt from 'bcryptjs';

const uri = "mongodb://amirlatif2288:amir2288@ac-zaazrcd-shard-00-00.h71spme.mongodb.net:27017,ac-zaazrcd-shard-00-01.h71spme.mongodb.net:27017,ac-zaazrcd-shard-00-02.h71spme.mongodb.net:27017/youtube-advertisement?ssl=true&replicaSet=atlas-1315x2-shard-0&authSource=admin&appName=Cluster0";

async function check() {
  await mongoose.connect(uri);
  const user = await User.findOne({ email: 'afaqsb99@gmail.com' });
  if (!user) {
    console.log("User not found!");
  } else {
    console.log("User found:", user.email, "role:", user.role);
    const valid = await bcrypt.compare("Afaqyt295@", user.passwordHash);
    console.log("Password 'Afaqyt295@' valid?", valid);
    const validNoAt = await bcrypt.compare("Afaqyt295", user.passwordHash);
    console.log("Password 'Afaqyt295' valid?", validNoAt);
  }
  process.exit(0);
}

check();
