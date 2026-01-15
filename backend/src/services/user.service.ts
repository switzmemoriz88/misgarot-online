// ==========================================
// שירות משתמשים
// ==========================================

import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface CreateUserParams {
  email: string;
  password: string;
  role: 'admin' | 'photographer' | 'client';
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

export class UserService {
  
  /**
   * יצירת משתמש חדש
   */
  async createUser(params: CreateUserParams): Promise<string> {
    const { email, password, role, firstName, lastName, phone } = params;
    
    // בדיקה אם המשתמש כבר קיים
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      throw new Error('משתמש עם אימייל זה כבר קיים');
    }
    
    // הצפנת הסיסמה
    const passwordHash = await bcrypt.hash(password, 10);
    
    const userId = uuidv4();
    
    await pool.query(
      `INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, email, passwordHash, role, firstName, lastName, phone]
    );
    
    // אם זה צלם, יוצרים גם רשומת צלם
    if (role === 'photographer') {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 ימי ניסיון
      
      await pool.query(
        `INSERT INTO photographers (id, subscription_status, trial_ends_at)
         VALUES ($1, 'trial', $2)`,
        [userId, trialEndsAt]
      );
    }
    
    return userId;
  }

  /**
   * התחברות
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      throw new Error('אימייל או סיסמה שגויים');
    }
    
    const user = result.rows[0];
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('אימייל או סיסמה שגויים');
    }
    
    // עדכון זמן התחברות אחרון
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // יצירת טוקן
    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn: '7d' }
    );
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    };
  }

  /**
   * שליפת משתמש לפי ID
   */
  async getUserById(userId: string) {
    const result = await pool.query(
      'SELECT id, email, role, first_name, last_name, phone, preferred_language, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  /**
   * אימות טוקן
   */
  verifyToken(token: string): { userId: string; role: string } {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        userId: string;
        role: string;
      };
      return decoded;
    } catch {
      throw new Error('טוקן לא תקין');
    }
  }
}

export const userService = new UserService();
