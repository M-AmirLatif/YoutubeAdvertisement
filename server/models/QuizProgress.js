import mongoose from 'mongoose';

const quizProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    completed: { type: Boolean, default: true }
  },
  { timestamps: true }
);

quizProgressSchema.index({ user: 1, quiz: 1 }, { unique: true });

export default mongoose.model('QuizProgress', quizProgressSchema);
