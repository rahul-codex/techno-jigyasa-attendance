import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import prisma from './config/db';
import { getUploadsDir } from './utils/file.util';
import routes from './routes';

const app = express();

// Security and middleware configuration
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving (protected/isolated)
app.use('/uploads/profiles', express.static(getUploadsDir()));

// Mount Application Routes
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    // Light ping check on database
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'unreachable';
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Techno Jigyasa Club Attendance API',
    environment: env.NODE_ENV,
    database: dbStatus,
  });
});

// Root API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'Techno Jigyasa Club - Smart Attendance Management System API',
    version: '1.0.0',
    description: 'Foundation and Database API Service',
  });
});

// Start Express Server
const server = app.listen(env.PORT, () => {
  console.log(`[Techno Jigyasa Server] Running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('[Techno Jigyasa Server] Gracefully shutting down...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[Techno Jigyasa Server] Prisma client disconnected. Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default app;
