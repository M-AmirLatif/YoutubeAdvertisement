import mongoose from 'mongoose';

const socialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const appSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'app' },
    socialLinks: { type: [socialLinkSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model('AppSettings', appSettingsSchema);
