import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for local development and testing
  credentials: true
}));

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup static uploads folder serving (for Cloudinary fallback)
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

import { startSlaScheduler } from './utils/slaScheduler';

// Connect to Database and start server
connectDB().then((uri) => {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` EcoCycle Backend Server running on port ${PORT}`);
    console.log(` Database: ${uri.startsWith('mongodb://127.0.0.1') ? 'In-Memory Mock Server' : 'External Connection'}`);
    console.log(` API Base URL: http://localhost:${PORT}/api`);
    console.log(`===============================================`);
    
    // Start background SLA deadline checks
    startSlaScheduler();
  });
}).catch(err => {
  console.error('Database connection failed to initialize', err);
  process.exit(1);
});

// Import routers
import authRoutes from './routes/auth';
import requestRoutes from './routes/requests';
import collectorRoutes from './routes/collector';
import recyclerRoutes from './routes/recycler';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';

// Bind API routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/collector', collectorRoutes);
app.use('/api/recycler', recyclerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Base route healthcheck
app.get('/api', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    message: 'Welcome to EcoCycle API Portal. Systems operational.',
    timestamp: new Date()
  });
});

import PlasticRequest from './models/PlasticRequest';
app.get('/api/debug-requests', async (req: Request, res: Response) => {
  try {
    const requests = await PlasticRequest.find({}).lean();
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    message: err.message || 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
