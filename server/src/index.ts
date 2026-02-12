import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import guestTokenRouter from './routes/guestToken.js';
import configRouter from './routes/config.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Access logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function (this: typeof res, ...args: unknown[]) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] [server:${PORT}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    return originalEnd.apply(this, args as Parameters<typeof originalEnd>);
  } as typeof res.end;
  next();
});

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', guestTokenRouter);
app.use('/api', configRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
