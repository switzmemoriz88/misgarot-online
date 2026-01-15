// ==========================================
// Routes - Clients
// ==========================================

import { Router, Request, Response } from 'express';
import { clientService } from '../services';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// שליפת כל הלקוחות של הצלם
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const photographerId = (req as any).userId;
    const clients = await clientService.getClientsByPhotographerId(photographerId);
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// יצירת לקוח חדש
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const photographerId = (req as any).userId;
    const { name, email, phone, eventDate, eventVenue } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'שם ואימייל נדרשים' });
    }
    
    const clientId = await clientService.createClient({
      photographerId,
      name,
      email,
      phone,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      eventVenue,
    });
    
    res.status(201).json({ 
      message: 'לקוח נוצר בהצלחה',
      clientId 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// שליפת לקוח ספציפי
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const client = await clientService.getClientById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ error: 'לקוח לא נמצא' });
    }
    
    res.json(client);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// איפוס עיצוב לקוח
router.post('/:id/reset', authMiddleware, async (req: Request, res: Response) => {
  try {
    await clientService.resetClientDesign(req.params.id);
    res.json({ message: 'העיצוב אופס בהצלחה' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
