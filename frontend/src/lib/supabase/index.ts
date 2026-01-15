// Supabase Library - Export all
export { SUPABASE_CONFIG, isSupabaseConfigured } from './config';
export { getSupabase, supabaseClient, isConnected } from './client';
export { authService } from './auth.service';
export { 
  categoriesService,
  framesService,
  designsService,
  ordersService,
  storageService 
} from './db.service';
export { emailService, sendWelcomeEmail, sendOrderConfirmationEmail } from './email.service';
export { 
  frameOrdersService,
  createFrameOrder,
  getUserOrders,
  updateOrderStatus,
  markOrderDownloaded,
  deleteOrder 
} from './frameOrders.service';
export type { CreateOrderData, FrameOrder, OrderResult } from './frameOrders.service';
export {
  publicGalleryService,
  publishFrameFromOrder,
  publishFrameDirectly,
  getPublicFrames,
  unpublishFrame
} from './publicGallery.service';
export type { PublicFrame, PublishFrameData, PublishResult } from './publicGallery.service';
export * from './types';
