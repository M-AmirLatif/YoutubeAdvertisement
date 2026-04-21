import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    youtubeUrl: { type: String, required: true, trim: true },
    youtubeId: { type: String, required: true, index: true },
    reward: { type: Number, default: 0.25 },
    durationSeconds: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Video', videoSchema);
