import express from 'express';
import Quiz from '../models/Quiz.js';
import QuizProgress from '../models/QuizProgress.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isActive: true }).sort({ createdAt: -1 });
    const progress = await QuizProgress.find({ user: req.user._id });
    
    // Don't send the correct option index to regular users to prevent cheating
    const safeQuizzes = quizzes.map((q) => {
      const qObj = q.toObject();
      qObj.questions = qObj.questions.map((question) => {
        delete question.correctOptionIndex;
        return question;
      });
      return qObj;
    });

    res.json({ quizzes: safeQuizzes, progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.create({
      title: String(req.body.title || '').trim(),
      reward: Number(req.body.reward) || 0.5,
      questions: req.body.questions || [],
      isActive: req.body.isActive !== false
    });
    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id, 
      {
        title: String(req.body.title || '').trim(),
        reward: Number(req.body.reward) || 0.5,
        questions: req.body.questions || [],
        isActive: req.body.isActive !== false
      },
      { new: true }
    );
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    await QuizProgress.deleteMany({ quiz: req.params.id });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/submit', requireAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.isActive) {
      return res.status(404).json({ message: 'Quiz not found or inactive' });
    }

    const answers = req.body.answers || [];
    let score = 0;
    
    // Evaluate answers
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctOptionIndex) {
        score++;
      }
    });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = await QuizProgress.findOne({ user: user._id, quiz: quiz._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already completed this quiz.' });
    }

    const progress = await QuizProgress.create({
      user: user._id,
      quiz: quiz._id,
      score,
      totalQuestions: quiz.questions.length,
      completed: true
    });

    // Credit reward
    if (quiz.reward > 0) {
      await User.findByIdAndUpdate(user._id, { $inc: { balance: quiz.reward } });
      await Transaction.create({
        user: user._id,
        type: 'task',
        amount: quiz.reward,
        status: 'approved',
        notes: `Reward for completing MCQ Task: ${quiz.title} (Score: ${score}/${quiz.questions.length})`
      });
    }

    res.json({ progress, score, totalQuestions: quiz.questions.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/verify', requireAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    
    const { questionIndex, answerIndex } = req.body;
    if (questionIndex >= quiz.questions.length) return res.status(400).json({ message: 'Invalid question index' });
    
    const correct = quiz.questions[questionIndex].correctOptionIndex === answerIndex;
    
    res.json({ correct, correctOptionIndex: quiz.questions[questionIndex].correctOptionIndex });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
