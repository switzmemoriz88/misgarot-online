/**
 * Database Types
 * ---------------
 * טיפוסים עבור כל הטבלאות במסד הנתונים
 * 
 * 💡 טיפ: אפשר לייצר את הקובץ הזה אוטומטית מ-Supabase:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 */

// =====================================================
// Database Schema Types
// =====================================================

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      categories: {
        Row: CategoryRow;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      frames: {
        Row: FrameRow;
        Insert: FrameInsert;
        Update: FrameUpdate;
      };
      designs: {
        Row: DesignRow;
        Insert: DesignInsert;
        Update: DesignUpdate;
      };
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItemRow;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Database Row Types (what you get from SELECT)
export type UserRow = User;
export type CategoryRow = Category;
export type FrameRow = Frame;
export type DesignRow = Design;
export type OrderRow = Order;
export type OrderItemRow = OrderItem;
export type SubscriptionRow = Subscription;

// Database Insert Types (what you send to INSERT)
export type UserInsert = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role?: string;
  avatar_url?: string | null;
  business_name?: string | null;
  business_logo?: string | null;
  is_active?: boolean;
  subscription_plan?: string | null;
  subscription_expires_at?: string | null;
};

export type CategoryInsert = {
  id?: string;
  name?: string;
  name_he?: string;
  name_en?: string;
  icon?: string | null;
  color?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type FrameInsert = {
  id?: string;
  category_id?: string | null;
  name: string;
  name_en?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  full_url?: string | null;
  preview_url?: string | null;
  colors?: string[];
  style?: string | null;
  is_premium?: boolean;
  price?: number;
  sort_order?: number;
  is_active?: boolean;
  width?: number;
  height?: number;
  orientation?: string;
  paired_frame_id?: string | null;
  usage_count?: number;
};

export type DesignInsert = {
  id?: string;
  user_id: string;
  frame_id?: string | null;
  category_id?: string | null;
  name: string;
  design_data: DesignData | Record<string, unknown>;
  thumbnail_url?: string | null;
  orientation?: 'landscape' | 'portrait' | 'both';
  is_template?: boolean;
  is_public?: boolean;
};

export type OrderInsert = {
  id?: string;
  user_id?: string | null;
  design_id?: string | null;
  status?: string;
  total_price: number;
  notes?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  shipping_address?: ShippingAddress | null;
};

export type OrderItemInsert = {
  id?: string;
  order_id: string;
  design_id?: string | null;
  image_url?: string | null;
  quantity: number;
  unit_price: number;
  options?: OrderItemOptions;
};

export type SubscriptionInsert = {
  id?: string;
  user_id: string;
  paypal_subscription_id?: string | null;
  paypal_plan_id?: string | null;
  plan: string;
  status: string;
  price?: number;
  currency?: string;
  frames_limit?: number;
  exports_limit?: number;
  storage_limit_mb?: number;
  starts_at?: string;
  expires_at?: string | null;
};

// Database Update Types (what you send to UPDATE)
export type UserUpdate = Partial<UserInsert>;
export type CategoryUpdate = Partial<CategoryInsert>;
export type FrameUpdate = Partial<FrameInsert>;
export type DesignUpdate = Partial<DesignInsert>;
export type OrderUpdate = Partial<OrderInsert>;
export type OrderItemUpdate = Partial<OrderItemInsert>;
export type SubscriptionUpdate = Partial<SubscriptionInsert>;

// =====================================================
// Entity Types
// =====================================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'admin' | 'photographer' | 'client' | string;
  avatar_url: string | null;
  business_name: string | null;
  business_logo: string | null;
  is_active: boolean;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_he: string;
  name_en: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Frame {
  id: string;
  category_id: string | null;
  name: string;
  name_en: string | null;
  description: string | null;
  thumbnail_url: string | null;
  full_url: string | null;
  preview_url: string | null;
  colors: string[];
  style: string | null;
  is_premium: boolean;
  price: number;
  sort_order: number;
  is_active: boolean;
  width: number;
  height: number;
  orientation: string;
  paired_frame_id: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Design {
  id: string;
  user_id: string;
  frame_id: string | null;
  category_id: string | null;
  name: string;
  design_data: DesignData;
  thumbnail_url: string | null;
  orientation: 'landscape' | 'portrait' | 'both';
  is_template: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignData {
  elements: CanvasElement[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  backgroundType: 'solid' | 'gradient';
  gradientColors?: {
    start: string;
    end: string;
    angle?: number;
  };
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'placeholder';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  name: string;
  // Type-specific properties
  [key: string]: unknown;
}

export interface Order {
  id: string;
  user_id: string | null;
  design_id: string | null;
  order_number: string;
  status: 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  total_price: number;
  notes: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: ShippingAddress | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  design_id: string | null;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  options: OrderItemOptions;
  created_at: string;
}

export interface OrderItemOptions {
  size?: string;
  material?: string;
  finish?: string;
  [key: string]: unknown;
}

export interface Subscription {
  id: string;
  user_id: string;
  paypal_subscription_id: string | null;
  paypal_plan_id: string | null;
  plan: 'free' | 'basic' | 'pro' | 'enterprise' | string;
  status: 'active' | 'cancelled' | 'expired' | string;
  price: number;
  currency: string;
  frames_limit: number;
  exports_limit: number;
  storage_limit_mb: number;
  starts_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =====================================================
// Auth Types
// =====================================================

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    avatar_url?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  phone?: string;
  business_name?: string;
}
