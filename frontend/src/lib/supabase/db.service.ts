import { getSupabase } from './client';
import type { 
  Frame, 
  Design, 
  Order, 
  OrderItem, 
  Category,
  ApiResponse,
  PaginatedResponse,
  DesignData 
} from './types';

/**
 * Database Service
 * -----------------
 * שירותים לעבודה עם הטבלאות
 */

// =====================================================
// Categories Service - קטגוריות
// =====================================================

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    return data || [];
  },

  async getById(id: string): Promise<Category | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    return data;
  },
};

// =====================================================
// Frames Service - מסגרות
// =====================================================

export const framesService = {
  async getAll(): Promise<Frame[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data } = await supabase
      .from('frames')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    return data || [];
  },

  async getByCategory(categoryId: string): Promise<Frame[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data } = await supabase
      .from('frames')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order');

    return data || [];
  },

  async getById(id: string): Promise<Frame | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data } = await supabase
      .from('frames')
      .select('*')
      .eq('id', id)
      .single();

    return data;
  },

  async getPremium(): Promise<Frame[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data } = await supabase
      .from('frames')
      .select('*')
      .eq('is_premium', true)
      .eq('is_active', true)
      .order('sort_order');

    return data || [];
  },
};

// =====================================================
// Designs Service - עיצובים
// =====================================================

export const designsService = {
  async getMyDesigns(page = 1, pageSize = 20): Promise<PaginatedResponse<Design>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: [], count: 0, page, pageSize, totalPages: 0 };
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count } = await supabase
      .from('designs')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to);

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async getById(id: string): Promise<Design | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data } = await supabase
      .from('designs')
      .select('*')
      .eq('id', id)
      .single();

    return data;
  },

  async create(design: {
    name: string;
    frame_id?: string;
    category_id?: string;
    design_data: DesignData;
    orientation?: 'landscape' | 'portrait' | 'both';
  }): Promise<ApiResponse<Design>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: { message: 'Not logged in' } };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('designs')
      .insert({
        ...design,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  },

  async update(id: string, updates: Partial<Design>): Promise<ApiResponse<Design>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('designs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', id);

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: null, error: null };
  },

  async saveAsTemplate(id: string, name: string): Promise<ApiResponse<Design>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('designs')
      .update({ is_template: true, name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  },

  async getTemplates(): Promise<Design[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data } = await supabase
      .from('designs')
      .select('*')
      .eq('is_template', true)
      .order('updated_at', { ascending: false });

    return data || [];
  },
};

// =====================================================
// Orders Service - הזמנות
// =====================================================

export const ordersService = {
  async getMyOrders(page = 1, pageSize = 20): Promise<PaginatedResponse<Order>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: [], count: 0, page, pageSize, totalPages: 0 };
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async getById(id: string): Promise<Order | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    return data;
  },

  async getByOrderNumber(orderNumber: string): Promise<Order | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber)
      .single();

    return data;
  },

  async create(order: {
    design_id?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    notes?: string;
    items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[];
  }): Promise<ApiResponse<Order>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Calculate total
    const total = order.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0);

    // Create order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newOrder, error } = await (supabase as any)
      .from('orders')
      .insert({
        user_id: user?.id || null,
        design_id: order.design_id || null,
        customer_name: order.customer_name || null,
        customer_email: order.customer_email || null,
        customer_phone: order.customer_phone || null,
        notes: order.notes || null,
        total_price: total,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !newOrder) {
      return { data: null, error: { message: error?.message || 'Failed to create order' } };
    }

    // Create order items
    const orderItems = order.items.map(item => ({
      ...item,
      order_id: newOrder.id,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('order_items').insert(orderItems);

    return { data: newOrder, error: null };
  },

  async updateStatus(id: string, status: Order['status']): Promise<ApiResponse<Order>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  },

  async cancel(id: string): Promise<ApiResponse<Order>> {
    return this.updateStatus(id, 'cancelled');
  },
};

// =====================================================
// Storage Service - אחסון קבצים
// =====================================================

export const storageService = {
  async uploadDesignThumbnail(designId: string, file: Blob): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const fileName = `${designId}/thumbnail.png`;
    
    const { error } = await supabase.storage
      .from('designs')
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('designs')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async uploadExport(designId: string, file: Blob, format: string): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const timestamp = Date.now();
    const fileName = `${designId}/${timestamp}.${format}`;
    
    const { error } = await supabase.storage
      .from('exports')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('exports')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async getFrameThumbnailUrl(frameId: string): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data } = supabase.storage
      .from('frames')
      .getPublicUrl(`${frameId}/thumbnail.png`);

    return data.publicUrl;
  },

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const ext = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${ext}`;
    
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
};
