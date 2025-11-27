import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';
import cors from 'cors';
import executeRouter from './routes/execute';
import errorsRouter from './routes/errors';
import chatRouter from './routes/chat';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50kb' })); // Limit request size

// Routes
app.use('/api', executeRouter);
app.use('/api/errors', errorsRouter);
app.use('/api/chat', chatRouter);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ message: 'Socrates Backend API', version: '1.0.0' });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
});

