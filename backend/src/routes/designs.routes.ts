// ==========================================
// Routes - Designs
// ==========================================

import { Router, Request, Response } from 'express';
import { designService } from '../services';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// שליפת עיצוב לפי ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const design = await designService.getDesignById(req.params.id);
    
    if (!design) {
      return res.status(404).json({ error: 'עיצוב לא נמצא' });
    }
    
    res.json(design);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// יצירת עיצוב חדש מתבנית
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientId, templateId, orientation } = req.body;
    
    if (!clientId || !templateId || !orientation) {
      return res.status(400).json({ error: 'חסרים פרמטרים' });
    }
    
    const design = await designService.createDesignFromTemplate(
      clientId,
      templateId,
      orientation
    );
    
    res.status(201).json(design);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// יצירת גרסת height מעיצוב width
router.post('/:id/create-height', authMiddleware, async (req: Request, res: Response) => {
  try {
    const design = await designService.createHeightDesignFromWidthDesign(req.params.id);
    res.status(201).json(design);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// עדכון אלמנט בעיצוב
router.patch('/:id/elements/:elementId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, elementId } = req.params;
    const updates = req.body;
    
    await designService.updateElementPosition(id, elementId, updates);
    res.json({ message: 'עודכן בהצלחה' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// הוספת אלמנט לעיצוב
router.post('/:id/elements', authMiddleware, async (req: Request, res: Response) => {
  try {
    const element = await designService.addElement(req.params.id, req.body);
    res.status(201).json(element);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// מחיקת אלמנט מעיצוב
router.delete('/:id/elements/:elementId', authMiddleware, async (req: Request, res: Response) => {
  try {
    await designService.deleteElement(req.params.id, req.params.elementId);
    res.json({ message: 'נמחק בהצלחה' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// נעילת עיצוב (שליחה)
router.post('/:id/lock', authMiddleware, async (req: Request, res: Response) => {
  try {
    await designService.lockDesign(req.params.id);
    res.json({ message: 'העיצוב נשלח בהצלחה' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
