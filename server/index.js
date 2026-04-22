import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import videoRoutes from './routes/videos.js';
import progressRoutes from './routes/progress.js';
import transactionRoutes from './routes/transactions.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configuredOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || '').split(',')
].filter(Boolean).map((origin) => origin.trim());
const allowedOrigins = [
  ...configuredOrigins,
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`
];

app.set('trust proxy', 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'youtube-advertisement-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');
if (fs.existsSync(indexPath)) {
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    immutable: true,
    maxAge: '1y'
  }));
  app.use('/assets', (_req, res) => {
    res.status(404).type('text/plain').send('Frontend asset not found. Rebuild the frontend and refresh the browser.');
  });
  app.use(express.static(distPath, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store');
      }
    }
  }));
  app.use((_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(indexPath);
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ ok: true, service: 'youtube-advertisement-api', frontend: process.env.CLIENT_URL || null });
  });
}

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/youtube-advertisement', {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
