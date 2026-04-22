import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, minlength: 3 },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    isOwner: { type: Boolean, default: false, index: true },
    isSuspended: { type: Boolean, default: false, index: true },
    passwordResetTokenHash: { type: String, default: '' },
    passwordResetExpiresAt: { type: Date, default: null },
    referralCode: { type: String, required: true, unique: true, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    balance: { type: Number, default: 0 },
    todayEarnings: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    referralEarnings: { type: Number, default: 0 },
    activePlan: {
      name: { type: String, default: 'Starter' },
      price: { type: Number, default: 0 },
      dailyLimit: { type: Number, default: 5 },
      rewardPerVideo: { type: Number, default: 0.25 }
    }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
