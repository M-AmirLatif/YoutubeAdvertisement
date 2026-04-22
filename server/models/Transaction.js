import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['deposit', 'withdrawal', 'referral', 'earning'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
    plan: { type: String, default: '' },
    walletAddress: { type: String, default: '' },
    network: { type: String, default: 'USDT-TRC20' },
    proof: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

transactionSchema.index(
  { type: 1, proof: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: 'deposit',
      proof: { $type: 'string', $gt: '' }
    }
  }
);

export default mongoose.model('Transaction', transactionSchema);
