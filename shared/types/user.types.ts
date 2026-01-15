// ==========================================
// סוגי משתמשים
// ==========================================

export type UserRole = 'admin' | 'photographer' | 'client';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';

// סטטוס הזמנת מסגרת
export type FrameOrderStatus = 
  | 'pending'           // כחול - ממתין
  | 'completed'         // ירוק - הושלם
  | 'publish_requested' // צהוב - בקשה לפרסום
  | 'published'         // סגול - פורסם למאגר
  | 'cancelled';        // אפור - בוטל

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferredLanguage: 'he' | 'en';
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface Photographer extends User {
  role: 'photographer';
  businessName?: string;
  businessLogo?: string;
  isStarred: boolean; // ⭐ צלם עם הרשאות מיוחדות
  subscription: {
    status: SubscriptionStatus;
    trialEndsAt?: Date;
    subscriptionEndsAt?: Date;
    plan?: string;
  };
}

// לקוח צד שלישי - נוצר על ידי צלם
export interface ThirdPartyClient extends User {
  role: 'client';
  photographerId: string; // הצלם שיצר אותו
  clientName: string; // שם הלקוח
  eventDate?: Date; // תאריך האירוע
}

export interface Client {
  id: string;
  photographerId: string;
  name: string;
  email: string;
  phone?: string;
  eventDate?: Date;
  eventVenue?: string;
  designStatus: 'open' | 'in_progress' | 'submitted' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

// הזמנת מסגרת
export interface FrameOrder {
  id: string;
  orderNumber: string;
  userId: string;
  photographerId?: string; // null אם הצלם הזמין לעצמו
  designId?: string;
  designData?: any; // snapshot של העיצוב
  thumbnailUrl?: string;
  status: FrameOrderStatus;
  
  // פרטי בקשת פרסום
  publishRequestedAt?: Date;
  publishRequestExpiresAt?: Date;
  publishedAt?: Date;
  publishedBy?: string;
  
  // מעקב השלמה
  completedAt?: Date;
  downloadedAt?: Date;
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (populated)
  user?: User;
  photographer?: Photographer;
}

// צבעי סטטוס להזמנות
export const ORDER_STATUS_COLORS: Record<FrameOrderStatus, { bg: string; text: string; border: string; label: string }> = {
  pending: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'ממתין'
  },
  completed: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'הושלם'
  },
  publish_requested: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    label: 'בקשה לפרסום'
  },
  published: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'פורסם'
  },
  cancelled: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
    label: 'בוטל'
  }
};

