// ==========================================
// נקודת הכניסה לשרת
// ==========================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { authRoutes, clientsRoutes, designsRoutes, templatesRoutes } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Misgarot Online API פועל',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/designs', designsRoutes);
app.use('/api/templates', templatesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'נתיב לא נמצא' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'שגיאת שרת פנימית' });
});

// הפעלת השרת
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log('🚀 ════════════════════════════════════════');
      console.log(`🚀 Misgarot Online API`);
      console.log(`🚀 השרת פועל על פורט ${PORT}`);
      console.log(`🚀 Health: http://localhost:${PORT}/api/health`);
      console.log('🚀 ════════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ שגיאה בהפעלת השרת:', error);
    process.exit(1);
  }
};

startServer();
