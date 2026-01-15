// ==========================================
// מודל העיצוב - הלב של המערכת
// ==========================================

export type ElementType = 'text' | 'image' | 'shape';
export type Orientation = 'width' | 'height';
export type DesignStatus = 'open' | 'in_progress' | 'submitted' | 'archived';

// אלמנט בודד בעיצוב
export interface DesignElement {
  id: string;
  type: ElementType;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation: number;
  zIndex: number;
  opacity: number;
  
  // לטקסט
  text?: {
    content: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    fillColor: string;
    shadow?: {
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
    };
    letterSpacing: number;
    lineHeight: number;
    align: 'left' | 'center' | 'right';
  };
  
  // לתמונה
  image?: {
    assetId?: string;        // אלמנט מהספרייה
    uploadedFileId?: string; // קובץ שהועלה
    src: string;
    originalWidth: number;
    originalHeight: number;
  };
  
  // לצורה
  shape?: {
    shapeType: 'rectangle' | 'circle' | 'line';
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
}

// עיצוב מלא
export interface Design {
  id: string;
  clientId: string;
  templateId: string;
  orientation: Orientation;
  status: DesignStatus;
  elements: DesignElement[];
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  isLocked: boolean;
}

// תבנית מסגרת
export interface FrameTemplate {
  id: string;
  name: {
    he: string;
    en: string;
  };
  orientation: Orientation;
  pixelWidth: number;
  pixelHeight: number;
  categoryId: string;
  baseBackgroundImage?: string;
  initialElementsJson: DesignElement[];
  pairedTemplateId?: string; // התבנית המקבילה (width<->height)
  isActive: boolean;
  createdAt: Date;
}

// קטגוריה
export interface Category {
  id: string;
  name: {
    he: string;
    en: string;
  };
  slug: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

// נכס (תמונה/אלמנט)
export interface Asset {
  id: string;
  type: 'library' | 'uploaded' | 'background';
  name?: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  category?: string;
  tags?: string[];
  uploadedBy?: string;
  isActive: boolean;
  createdAt: Date;
}
