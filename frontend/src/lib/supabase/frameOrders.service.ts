// ==========================================
// Frame Orders Service - שירות הזמנות מסגרות
// ==========================================

import { supabaseClient } from './client';

export interface CreateOrderData {
  userId: string;
  photographerId?: string; // null if photographer orders for self
  designId?: string;
  designData?: any;
  thumbnailUrl?: string;
  notes?: string;
  requestPublish?: boolean; // Request to publish to public gallery
}

export interface FrameOrder {
  id: string;
  order_number: string;
  user_id: string;
  photographer_id: string | null;
  design_id: string | null;
  design_data: any;
  thumbnail_url: string | null;
  status: 'pending' | 'completed' | 'publish_requested' | 'published' | 'cancelled';
  publish_requested_at: string | null;
  publish_request_expires_at: string | null;
  completed_at: string | null;
  downloaded_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderResult {
  success: boolean;
  order?: FrameOrder;
  orderNumber?: string;
  error?: string;
}

/**
 * Create a new frame order
 */
export const createFrameOrder = async (data: CreateOrderData): Promise<OrderResult> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) {
      return { success: false, error: 'Database not connected' };
    }

    const orderData: any = {
      user_id: data.userId,
      photographer_id: data.photographerId || null,
      design_id: data.designId || null,
      design_data: data.designData || null,
      thumbnail_url: data.thumbnailUrl || null,
      notes: data.notes || null,
      status: data.requestPublish ? 'publish_requested' : 'pending',
    };

    // If requesting publish, set expiration (6 months)
    if (data.requestPublish) {
      orderData.publish_requested_at = new Date().toISOString();
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 6);
      orderData.publish_request_expires_at = expires.toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (supabase as any)
      .from('frame_orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      order,
      orderNumber: order.order_number
    };
  } catch (err) {
    console.error('Failed to create order:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

/**
 * Get orders for a user
 */
export const getUserOrders = async (userId: string): Promise<FrameOrder[]> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('frame_orders')
      .select('*')
      .or(`user_id.eq.${userId},photographer_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    return [];
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string, 
  status: FrameOrder['status'],
  additionalData?: Partial<FrameOrder>
): Promise<OrderResult> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) {
      return { success: false, error: 'Database not connected' };
    }

    const updates: any = { status, ...additionalData };

    // Add timestamps based on status
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    } else if (status === 'publish_requested') {
      updates.publish_requested_at = new Date().toISOString();
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 6);
      updates.publish_request_expires_at = expires.toISOString();
    } else if (status === 'published') {
      updates.published_at = new Date().toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (supabase as any)
      .from('frame_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return { success: false, error: error.message };
    }

    return { success: true, order };
  } catch (err) {
    console.error('Failed to update order:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

/**
 * Mark order as downloaded (auto-complete)
 */
export const markOrderDownloaded = async (orderId: string): Promise<OrderResult> => {
  return updateOrderStatus(orderId, 'completed', {
    downloaded_at: new Date().toISOString()
  } as any);
};

/**
 * Delete an order
 */
export const deleteOrder = async (orderId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) {
      return { success: false, error: 'Database not connected' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('frame_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error deleting order:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to delete order:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

export const frameOrdersService = {
  createFrameOrder,
  getUserOrders,
  updateOrderStatus,
  markOrderDownloaded,
  deleteOrder
};

export default frameOrdersService;
