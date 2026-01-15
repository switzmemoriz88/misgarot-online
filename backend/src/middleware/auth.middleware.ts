// ==========================================
// Middleware - Auth
// ==========================================

import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'לא מורשה - טוקן לא סופק' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = userService.verifyToken(token);
    
    // הוספת מזהה המשתמש לבקשה
    (req as any).userId = decoded.userId;
    (req as any).userRole = decoded.role;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'לא מורשה - טוקן לא תקין' });
  }
};

// Middleware לבדיקת תפקיד Admin
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if ((req as any).userRole !== 'admin') {
    return res.status(403).json({ error: 'גישה נדחתה - נדרשות הרשאות מנהל' });
  }
  next();
};

// Middleware לבדיקת תפקיד צלם
export const photographerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if ((req as any).userRole !== 'photographer' && (req as any).userRole !== 'admin') {
    return res.status(403).json({ error: 'גישה נדחתה - נדרשות הרשאות צלם' });
  }
  next();
};
