// ==========================================
// הגדרות מסד נתונים
// ==========================================

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'misgarot_online',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ התחברות למסד הנתונים הצליחה');
    client.release();
  } catch (error) {
    console.error('❌ שגיאה בהתחברות למסד הנתונים:', error);
    process.exit(1);
  }
};

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('📊 Query:', { text: text.substring(0, 50), duration, rows: res.rowCount });
  return res;
};
