import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true, index: true },
    watchedSeconds: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    rewardPaid: { type: Boolean, default: false }
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, video: 1 }, { unique: true });

export default mongoose.model('Progress', progressSchema);
