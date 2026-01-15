// ==========================================
// שירות עיצובים - הלוגיקה המרכזית
// ==========================================

import { pool } from '../config/database';
import { Design, DesignElement, Orientation } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class DesignService {
  
  /**
   * יצירת עיצוב חדש מתבנית
   */
  async createDesignFromTemplate(
    clientId: string,
    templateId: string,
    orientation: Orientation
  ): Promise<Design> {
    // שליפת התבנית
    const templateResult = await pool.query(
      'SELECT * FROM frame_templates WHERE id = $1',
      [templateId]
    );
    
    if (templateResult.rows.length === 0) {
      throw new Error('תבנית לא נמצאה');
    }
    
    const template = templateResult.rows[0];
    
    // יצירת העיצוב עם האלמנטים ההתחלתיים מהתבנית
    const designId = uuidv4();
    const initialElements = template.initial_elements_json || [];
    
    await pool.query(
      `INSERT INTO designs (id, client_id, template_id, orientation, elements_json)
       VALUES ($1, $2, $3, $4, $5)`,
      [designId, clientId, templateId, orientation, JSON.stringify(initialElements)]
    );
    
    return {
      id: designId,
      clientId,
      templateId,
      orientation,
      status: 'open',
      elements: initialElements,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * יצירת גרסת height מעיצוב width קיים
   */
  async createHeightDesignFromWidthDesign(
    widthDesignId: string
  ): Promise<Design> {
    // שליפת עיצוב ה-width
    const widthResult = await pool.query(
      `SELECT d.*, ft.paired_template_id, ft.pixel_width, ft.pixel_height
       FROM designs d
       JOIN frame_templates ft ON d.template_id = ft.id
       WHERE d.id = $1`,
      [widthDesignId]
    );
    
    if (widthResult.rows.length === 0) {
      throw new Error('עיצוב width לא נמצא');
    }
    
    const widthDesign = widthResult.rows[0];
    const heightTemplateId = widthDesign.paired_template_id;
    
    if (!heightTemplateId) {
      throw new Error('לא נמצאה תבנית height מקבילה');
    }
    
    // שליפת תבנית ה-height
    const heightTemplateResult = await pool.query(
      'SELECT * FROM frame_templates WHERE id = $1',
      [heightTemplateId]
    );
    
    const heightTemplate = heightTemplateResult.rows[0];
    
    // המרת האלמנטים מ-width ל-height
    const widthElements: DesignElement[] = widthDesign.elements_json;
    const mappedElements = this.mapElementsToNewOrientation(
      widthElements,
      { width: widthDesign.pixel_width, height: widthDesign.pixel_height },
      { width: heightTemplate.pixel_width, height: heightTemplate.pixel_height }
    );
    
    // יצירת עיצוב ה-height
    const designId = uuidv4();
    
    await pool.query(
      `INSERT INTO designs (id, client_id, template_id, orientation, elements_json)
       VALUES ($1, $2, $3, 'height', $4)`,
      [designId, widthDesign.client_id, heightTemplateId, JSON.stringify(mappedElements)]
    );
    
    return {
      id: designId,
      clientId: widthDesign.client_id,
      templateId: heightTemplateId,
      orientation: 'height',
      status: 'open',
      elements: mappedElements,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * המרת מיקומי אלמנטים בין orientations
   */
  private mapElementsToNewOrientation(
    elements: DesignElement[],
    sourceSize: { width: number; height: number },
    targetSize: { width: number; height: number }
  ): DesignElement[] {
    const scaleX = targetSize.width / sourceSize.width;
    const scaleY = targetSize.height / sourceSize.height;
    const scale = Math.min(scaleX, scaleY) * 0.8; // 80% כדי להשאיר שוליים
    
    const offsetX = (targetSize.width - sourceSize.width * scale) / 2;
    const offsetY = (targetSize.height - sourceSize.height * scale) / 2;
    
    return elements.map(element => ({
      ...element,
      id: uuidv4(), // מזהה חדש לאלמנט
      position: {
        x: element.position.x * scale + offsetX,
        y: element.position.y * scale + offsetY,
      },
      size: {
        width: element.size.width * scale,
        height: element.size.height * scale,
      },
    }));
  }

  /**
   * עדכון מיקום אלמנט
   */
  async updateElementPosition(
    designId: string,
    elementId: string,
    newProps: Partial<DesignElement>
  ): Promise<void> {
    const result = await pool.query(
      'SELECT elements_json FROM designs WHERE id = $1 AND is_locked = false',
      [designId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('עיצוב לא נמצא או נעול');
    }
    
    const elements: DesignElement[] = result.rows[0].elements_json;
    const updatedElements = elements.map(el => 
      el.id === elementId ? { ...el, ...newProps } : el
    );
    
    await pool.query(
      `UPDATE designs SET elements_json = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [JSON.stringify(updatedElements), designId]
    );
  }

  /**
   * הוספת אלמנט לעיצוב
   */
  async addElement(designId: string, element: Omit<DesignElement, 'id'>): Promise<DesignElement> {
    const result = await pool.query(
      'SELECT elements_json FROM designs WHERE id = $1 AND is_locked = false',
      [designId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('עיצוב לא נמצא או נעול');
    }
    
    const elements: DesignElement[] = result.rows[0].elements_json;
    const newElement: DesignElement = {
      ...element,
      id: uuidv4(),
    };
    
    elements.push(newElement);
    
    await pool.query(
      `UPDATE designs SET elements_json = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [JSON.stringify(elements), designId]
    );
    
    return newElement;
  }

  /**
   * מחיקת אלמנט מעיצוב
   */
  async deleteElement(designId: string, elementId: string): Promise<void> {
    const result = await pool.query(
      'SELECT elements_json FROM designs WHERE id = $1 AND is_locked = false',
      [designId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('עיצוב לא נמצא או נעול');
    }
    
    const elements: DesignElement[] = result.rows[0].elements_json;
    const updatedElements = elements.filter(el => el.id !== elementId);
    
    await pool.query(
      `UPDATE designs SET elements_json = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [JSON.stringify(updatedElements), designId]
    );
  }

  /**
   * נעילת עיצוב לאחר שליחה
   */
  async lockDesign(designId: string): Promise<void> {
    await pool.query(
      `UPDATE designs 
       SET is_locked = true, status = 'submitted', submitted_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [designId]
    );
  }

  /**
   * שליפת עיצוב לפי ID
   */
  async getDesignById(designId: string): Promise<Design | null> {
    const result = await pool.query(
      'SELECT * FROM designs WHERE id = $1',
      [designId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      clientId: row.client_id,
      templateId: row.template_id,
      orientation: row.orientation,
      status: row.status,
      elements: row.elements_json,
      isLocked: row.is_locked,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      submittedAt: row.submitted_at,
    };
  }

  /**
   * שליפת עיצובים של לקוח
   */
  async getDesignsByClientId(clientId: string): Promise<Design[]> {
    const result = await pool.query(
      'SELECT * FROM designs WHERE client_id = $1 ORDER BY created_at DESC',
      [clientId]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      clientId: row.client_id,
      templateId: row.template_id,
      orientation: row.orientation,
      status: row.status,
      elements: row.elements_json,
      isLocked: row.is_locked,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      submittedAt: row.submitted_at,
    }));
  }
}

export const designService = new DesignService();
