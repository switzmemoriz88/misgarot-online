// ==========================================
// Routes - Templates
// ==========================================

import { Router, Request, Response } from 'express';
import { templateService } from '../services';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// שליפת כל הקטגוריות
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await templateService.getAllCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// שליפת כל התבניות
router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await templateService.getAllTemplates();
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// שליפת תבניות width לפי קטגוריה
router.get('/category/:categoryId/width', async (req: Request, res: Response) => {
  try {
    const templates = await templateService.getWidthTemplatesByCategory(req.params.categoryId);
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// שליפת תבנית לפי ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'תבנית לא נמצאה' });
    }
    
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// יצירת תבנית חדשה (Admin בלבד)
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const templateId = await templateService.createTemplate(req.body);
    res.status(201).json({ 
      message: 'תבנית נוצרה בהצלחה',
      templateId 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// חיבור תבניות width ו-height
router.post('/pair', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { widthTemplateId, heightTemplateId } = req.body;
    
    if (!widthTemplateId || !heightTemplateId) {
      return res.status(400).json({ error: 'נדרשים שני מזהי תבניות' });
    }
    
    await templateService.pairTemplates(widthTemplateId, heightTemplateId);
    res.json({ message: 'התבניות חוברו בהצלחה' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
