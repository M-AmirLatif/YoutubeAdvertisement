import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function clear() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped completely!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
clear();
