// ==========================================
// שירות תבניות
// ==========================================

import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface CreateTemplateParams {
  nameHe: string;
  nameEn: string;
  orientation: 'width' | 'height';
  pixelWidth: number;
  pixelHeight: number;
  categoryId?: string;
  baseBackgroundImage?: string;
  initialElementsJson?: object[];
  pairedTemplateId?: string;
}

export class TemplateService {
  
  /**
   * יצירת תבנית חדשה
   */
  async createTemplate(params: CreateTemplateParams): Promise<string> {
    const {
      nameHe,
      nameEn,
      orientation,
      pixelWidth,
      pixelHeight,
      categoryId,
      baseBackgroundImage,
      initialElementsJson,
      pairedTemplateId,
    } = params;
    
    const templateId = uuidv4();
    
    await pool.query(
      `INSERT INTO frame_templates 
       (id, name_he, name_en, orientation, pixel_width, pixel_height, category_id, base_background_image, initial_elements_json, paired_template_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        templateId,
        nameHe,
        nameEn,
        orientation,
        pixelWidth,
        pixelHeight,
        categoryId,
        baseBackgroundImage,
        JSON.stringify(initialElementsJson || []),
        pairedTemplateId,
      ]
    );
    
    return templateId;
  }

  /**
   * שליפת כל התבניות
   */
  async getAllTemplates() {
    const result = await pool.query(
      `SELECT ft.*, c.name_he as category_name_he, c.name_en as category_name_en
       FROM frame_templates ft
       LEFT JOIN categories c ON ft.category_id = c.id
       WHERE ft.is_active = true
       ORDER BY c.sort_order, ft.name_he`
    );
    
    return result.rows;
  }

  /**
   * שליפת תבניות לפי קטגוריה
   */
  async getTemplatesByCategory(categoryId: string) {
    const result = await pool.query(
      `SELECT * FROM frame_templates 
       WHERE category_id = $1 AND is_active = true
       ORDER BY name_he`,
      [categoryId]
    );
    
    return result.rows;
  }

  /**
   * שליפת תבניות width לפי קטגוריה (לתצוגה ללקוח)
   */
  async getWidthTemplatesByCategory(categoryId: string) {
    const result = await pool.query(
      `SELECT * FROM frame_templates 
       WHERE category_id = $1 AND orientation = 'width' AND is_active = true
       ORDER BY name_he`,
      [categoryId]
    );
    
    return result.rows;
  }

  /**
   * שליפת תבנית לפי ID
   */
  async getTemplateById(templateId: string) {
    const result = await pool.query(
      'SELECT * FROM frame_templates WHERE id = $1',
      [templateId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  /**
   * חיבור בין תבנית width לתבנית height
   */
  async pairTemplates(widthTemplateId: string, heightTemplateId: string): Promise<void> {
    // עדכון שני הכיוונים
    await pool.query(
      'UPDATE frame_templates SET paired_template_id = $1 WHERE id = $2',
      [heightTemplateId, widthTemplateId]
    );
    
    await pool.query(
      'UPDATE frame_templates SET paired_template_id = $1 WHERE id = $2',
      [widthTemplateId, heightTemplateId]
    );
  }

  /**
   * שליפת כל הקטגוריות
   */
  async getAllCategories() {
    const result = await pool.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY sort_order'
    );
    
    return result.rows;
  }
}

export const templateService = new TemplateService();
