import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Video from '../models/Video.js';
import { extractYoutubeId } from '../utils/youtube.js';

dotenv.config();

const samples = [
  {
    title: 'Brand awareness campaign',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    reward: 0.25,
    durationSeconds: 30
  },
  {
    title: 'Mobile app promotion',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    reward: 0.35,
    durationSeconds: 45
  },
  {
    title: 'Product launch teaser',
    youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    reward: 0.5,
    durationSeconds: 60
  }
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/youtube-advertisement', {
    serverSelectionTimeoutMS: 5000
  });

  for (const item of samples) {
    const youtubeId = extractYoutubeId(item.youtubeUrl);
    await Video.findOneAndUpdate({ youtubeId }, { ...item, youtubeId, isActive: true }, { upsert: true, returnDocument: 'after' });
  }

  await mongoose.disconnect();
  console.log(`Seeded ${samples.length} videos.`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
