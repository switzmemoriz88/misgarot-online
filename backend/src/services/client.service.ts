// ==========================================
// שירות לקוחות
// ==========================================

import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface CreateClientParams {
  photographerId: string;
  name: string;
  email: string;
  phone?: string;
  eventDate?: Date;
  eventVenue?: string;
}

export class ClientService {
  
  /**
   * יצירת לקוח חדש
   */
  async createClient(params: CreateClientParams): Promise<string> {
    const { photographerId, name, email, phone, eventDate, eventVenue } = params;
    
    const clientId = uuidv4();
    
    await pool.query(
      `INSERT INTO clients (id, photographer_id, name, email, phone, event_date, event_venue)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [clientId, photographerId, name, email, phone, eventDate, eventVenue]
    );
    
    return clientId;
  }

  /**
   * שליפת לקוחות של צלם
   */
  async getClientsByPhotographerId(photographerId: string) {
    const result = await pool.query(
      `SELECT * FROM clients WHERE photographer_id = $1 ORDER BY created_at DESC`,
      [photographerId]
    );
    
    return result.rows;
  }

  /**
   * שליפת לקוח לפי ID
   */
  async getClientById(clientId: string) {
    const result = await pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [clientId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  /**
   * עדכון סטטוס עיצוב של לקוח
   */
  async updateDesignStatus(clientId: string, status: string): Promise<void> {
    await pool.query(
      `UPDATE clients SET design_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, clientId]
    );
  }

  /**
   * מחיקת עיצוב ופתיחה מחדש
   */
  async resetClientDesign(clientId: string): Promise<void> {
    // סימון העיצובים הקיימים כארכיון
    await pool.query(
      `UPDATE designs SET status = 'archived' WHERE client_id = $1`,
      [clientId]
    );
    
    // החזרת סטטוס הלקוח ל-open
    await pool.query(
      `UPDATE clients SET design_status = 'open', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [clientId]
    );
  }
}

export const clientService = new ClientService();
