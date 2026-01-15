// ==========================================
// Public Gallery Service - שירות גלריה ציבורית
// ==========================================

import { supabaseClient } from './client';

export interface PublicFrame {
  id: string;
  order_id: string | null;
  original_creator_id: string | null;
  name: string;
  thumbnail_url: string;
  full_image_url: string | null;
  design_data: any;
  category_id: string | null;
  tags: string[];
  creator_name: string | null;
  creator_business: string | null;
  show_creator_credit: boolean;
  published_by: string | null;
  published_at: string;
  expires_at: string | null;
  view_count: number;
  download_count: number;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  // Joined
  category_name?: string;
  category_slug?: string;
}

export interface PublishFrameData {
  orderId: string;
  categoryId?: string;
  name?: string;
  tags?: string[];
}

export interface PublishResult {
  success: boolean;
  publicFrameId?: string;
  error?: string;
}

/**
 * Publish a frame from an order to the public gallery
 */
export const publishFrameFromOrder = async (data: PublishFrameData): Promise<PublishResult> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) {
      return { success: false, error: 'Database not connected' };
    }

    // Call the database function
    const { data: result, error } = await (supabase as any).rpc('publish_frame_from_order', {
      p_order_id: data.orderId,
      p_category_id: data.categoryId || null,
      p_name: data.name || null,
      p_tags: data.tags || []
    });

    if (error) {
      console.error('Error publishing frame:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      publicFrameId: result
    };
  } catch (err) {
    console.error('Failed to publish frame:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

/**
 * Direct publish for starred photographers (bypasses order)
 */
export const publishFrameDirectly = async (frameData: {
  name: string;
  thumbnailUrl: string;
  fullImageUrl?: string;
  designData?: any;
  categoryId?: string;
  tags?: string[];
  creatorName?: string;
  creatorBusiness?: string;
}): Promise<PublishResult> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) {
      return { success: false, error: 'Database not connected' };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Calculate expiration (6 months)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    const { data: publicFrame, error } = await (supabase as any)
      .from('public_frames')
      .insert({
        original_creator_id: user.id,
        name: frameData.name,
        thumbnail_url: frameData.thumbnailUrl,
        full_image_url: frameData.fullImageUrl || null,
        design_data: frameData.designData || null,
        category_id: frameData.categoryId || null,
        tags: frameData.tags || [],
        creator_name: frameData.creatorName || null,
        creator_business: frameData.creatorBusiness || null,
        published_by: user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error publishing frame directly:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      publicFrameId: publicFrame.id
    };
  } catch (err) {
    console.error('Failed to publish frame:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

/**
 * Get public frames for gallery
 */
export const getPublicFrames = async (options?: {
  categoryId?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}): Promise<PublicFrame[]> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) return [];

    let query = (supabase as any)
      .from('public_gallery')
      .select('*');

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options?.featured) {
      query = query.eq('is_featured', true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching public frames:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch public frames:', err);
    return [];
  }
};

/**
 * Increment view count
 */
export const incrementViewCount = async (frameId: string): Promise<void> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) return;

    await (supabase as any).rpc('increment_frame_view', { frame_id: frameId });
  } catch (err) {
    console.error('Failed to increment view count:', err);
  }
};

/**
 * Increment download count
 */
export const incrementDownloadCount = async (frameId: string): Promise<void> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) return;

    await (supabase as any).rpc('increment_frame_download', { frame_id: frameId });
  } catch (err) {
    console.error('Failed to increment download count:', err);
  }
};

/**
 * Unpublish a frame (admin only)
 */
export const unpublishFrame = async (frameId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) {
      return { success: false, error: 'Database not connected' };
    }

    const { error } = await (supabase as any)
      .from('public_frames')
      .update({ is_active: false })
      .eq('id', frameId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to unpublish frame:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

export const publicGalleryService = {
  publishFrameFromOrder,
  publishFrameDirectly,
  getPublicFrames,
  incrementViewCount,
  incrementDownloadCount,
  unpublishFrame
};

export default publicGalleryService;
