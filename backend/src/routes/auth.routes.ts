// ==========================================
// Routes - Auth
// ==========================================

import { Router, Request, Response } from 'express';
import { userService } from '../services';

const router = Router();

// התחברות
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'אימייל וסיסמה נדרשים' });
    }
    
    const result = await userService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// הרשמת צלם חדש
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, businessName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'אימייל וסיסמה נדרשים' });
    }
    
    const userId = await userService.createUser({
      email,
      password,
      role: 'photographer',
      firstName,
      lastName,
      phone,
    });
    
    res.status(201).json({ 
      message: 'משתמש נוצר בהצלחה',
      userId 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// בדיקת טוקן
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'טוקן לא סופק' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = userService.verifyToken(token);
    const user = await userService.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }
    
    res.json(user);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

export default router;
