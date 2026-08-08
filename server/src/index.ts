import mongoose from 'mongoose';
import { config } from './config/index.js';
import { createApp } from './app.js';

const app = createApp();

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

void connectDB();

const server = app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    await mongoose.connection.close();
    console.log('Process terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

export default app;
