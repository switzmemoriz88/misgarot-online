// ==========================================
// OrdersManagementPage - ניהול הזמנות מסגרות
// ==========================================

import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, Download, Eye, Trash2, 
  CheckCircle, Clock, Star, Upload, Calendar,
  ChevronDown, X, Image, Tag
} from 'lucide-react';
import { supabaseClient, publishFrameFromOrder } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

// Types
type FrameOrderStatus = 
  | 'pending'           // כחול - ממתין
  | 'completed'         // ירוק - הושלם
  | 'publish_requested' // צהוב - בקשה לפרסום
  | 'published'         // סגול - פורסם למאגר
  | 'cancelled';        // אפור - בוטל

const ORDER_STATUS_COLORS: Record<FrameOrderStatus, { bg: string; text: string; border: string; label: string }> = {
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

interface FrameOrder {
  id: string;
  order_number: string;
  user_id: string;
  photographer_id: string | null;
  design_id: string | null;
  thumbnail_url: string | null;
  thumbnail_landscape_url?: string | null;
  thumbnail_portrait_url?: string | null;
  design_data?: any;
  status: FrameOrderStatus;
  publish_requested_at: string | null;
  completed_at: string | null;
  created_at: string;
  notes: string | null;
  // Joined
  user_email?: string;
  user_name?: string;
  client_name?: string;
  event_date?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type StatusFilter = 'all' | FrameOrderStatus;
type SortOrder = 'newest' | 'oldest' | 'publish_requests';

export const OrdersManagementPage: React.FC = () => {
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'admin';
  
  const [orders, setOrders] = useState<FrameOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<FrameOrder | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingOrder, setPublishingOrder] = useState<FrameOrder | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      if (!supabaseClient) return;
      const { data } = await (supabaseClient as any)
        .from('categories')
        .select('id, name, slug')
        .order('display_order');
      if (data) setCategories(data);
    };
    loadCategories();
  }, []);

  // Load orders
  useEffect(() => {
    loadOrders();
  }, [user, statusFilter, sortOrder]);

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let query = (supabaseClient as any)
        .from('frame_orders')
        .select(`
          *,
          users!frame_orders_user_id_fkey (
            email,
            name,
            client_name,
            event_date
          )
        `);
      
      // Filter by role
      if (!isAdmin) {
        // Photographer sees own orders and their clients' orders
        query = query.or(`user_id.eq.${user.id},photographer_id.eq.${user.id}`);
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Sort
      if (sortOrder === 'publish_requests') {
        query = query
          .eq('status', 'publish_requested')
          .order('publish_requested_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: sortOrder === 'oldest' });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Flatten user data
      const flattenedOrders = (data || []).map((order: any) => ({
        ...order,
        user_email: order.users?.email,
        user_name: order.users?.name,
        client_name: order.users?.client_name,
        event_date: order.users?.event_date
      }));
      
      setOrders(flattenedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: FrameOrderStatus) => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else if (newStatus === 'publish_requested') {
        updates.publish_requested_at = new Date().toISOString();
        // Expires in 6 months
        const expires = new Date();
        expires.setMonth(expires.getMonth() + 6);
        updates.publish_request_expires_at = expires.toISOString();
      } else if (newStatus === 'published') {
        updates.published_at = new Date().toISOString();
        updates.published_by = user?.id;
      }
      
      const { error } = await (supabaseClient as any)
        .from('frame_orders')
        .update(updates)
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      ));
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('האם למחוק את ההזמנה?')) return;
    
    try {
      const { error } = await (supabaseClient as any)
        .from('frame_orders')
        .delete()
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  // Handle download landscape (2500x1875)
  const handleDownloadLandscape = async (order: FrameOrder) => {
    try {
      const url = order.thumbnail_landscape_url || order.thumbnail_url;
      if (!url) {
        alert('אין תמונת רוחב זמינה');
        return;
      }
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `frame_${order.order_number}_landscape.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Mark as completed if pending
      if (order.status === 'pending') {
        await handleMarkAsCompleted(order);
      }
    } catch (error) {
      console.error('Error downloading landscape:', error);
      alert('שגיאה בהורדת מסגרת רוחב');
    }
  };

  // Handle download portrait (1875x2500)
  const handleDownloadPortrait = async (order: FrameOrder) => {
    try {
      const url = order.thumbnail_portrait_url;
      if (!url) {
        alert('אין תמונת אורך זמינה');
        return;
      }
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `frame_${order.order_number}_portrait.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Mark as completed if pending
      if (order.status === 'pending') {
        await handleMarkAsCompleted(order);
      }
    } catch (error) {
      console.error('Error downloading portrait:', error);
      alert('שגיאה בהורדת מסגרת אורך');
    }
  };

  // Helper to mark order as completed
  const handleMarkAsCompleted = async (order: FrameOrder) => {
    const updates = {
      status: 'completed' as FrameOrderStatus,
      completed_at: new Date().toISOString(),
      downloaded_at: new Date().toISOString()
    };

    const { error } = await (supabaseClient as any)
      .from('frame_orders')
      .update(updates)
      .eq('id', order.id);

    if (error) throw error;

    // Update local state
    setOrders(prev => prev.map(o =>
      o.id === order.id ? { ...o, ...updates } as FrameOrder : o
    ));

    // Also update selectedOrder if it's the same
    if (selectedOrder?.id === order.id) {
      setSelectedOrder({ ...order, ...updates } as FrameOrder);
    }
  };

  // Handle edit order - open in editor
  const handleEditOrder = (order: FrameOrder) => {
    // Store order data in sessionStorage for the editor to load
    sessionStorage.setItem('editingOrder', JSON.stringify({
      orderId: order.id,
      orderNumber: order.order_number,
      thumbnailUrl: order.thumbnail_url,
      designId: order.design_id
    }));
    
    // Navigate to editor with order context
    window.location.href = `/editor/landscape?orderId=${order.id}`;
  };

  // Filter by search
  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    publish_requested: orders.filter(o => o.status === 'publish_requested').length,
    published: orders.filter(o => o.status === 'published').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">הזמנות מסגרות</h1>
              <p className="text-sm text-gray-500">{orders.length} הזמנות</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Search & Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש לפי מספר הזמנה, מייל או שם..."
                className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${
                showFilters ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              פילטרים
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                {/* Status Pills */}
                <div className="flex flex-wrap gap-2">
                  {(['all', 'pending', 'completed', 'publish_requested', 'published'] as StatusFilter[]).map(status => {
                    const colors = status === 'all' 
                      ? { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
                      : ORDER_STATUS_COLORS[status];
                    const labels: Record<StatusFilter, string> = {
                      all: 'הכל',
                      pending: 'ממתין',
                      completed: 'הושלם',
                      publish_requested: 'בקשה לפרסום',
                      published: 'פורסם',
                      cancelled: 'בוטל'
                    };
                    
                    return (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          statusFilter === status
                            ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-offset-1 ring-${colors.text.replace('text-', '')}`
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {labels[status]}
                        <span className="mr-1 opacity-60">({statusCounts[status]})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sort */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="newest">החדש ביותר</option>
                  <option value="oldest">הישן ביותר</option>
                  {isAdmin && (
                    <option value="publish_requests">בקשות לפרסום</option>
                  )}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין הזמנות</h3>
            <p className="text-gray-500">הזמנות חדשות יופיעו כאן</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                isAdmin={isAdmin}
                onUpdateStatus={updateOrderStatus}
                onDelete={handleDeleteOrder}
                onView={() => setSelectedOrder(order)}
                onDownloadLandscape={handleDownloadLandscape}
                onDownloadPortrait={handleDownloadPortrait}
                onEdit={handleEditOrder}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isAdmin={isAdmin}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateOrderStatus}
          onDownloadLandscape={handleDownloadLandscape}
          onDownloadPortrait={handleDownloadPortrait}
          onPublish={(order) => {
            setPublishingOrder(order);
            setShowPublishModal(true);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Publish Frame Modal */}
      {showPublishModal && publishingOrder && (
        <PublishFrameModal
          order={publishingOrder}
          categories={categories}
          onClose={() => {
            setShowPublishModal(false);
            setPublishingOrder(null);
          }}
          onPublished={(orderId) => {
            // Update local state
            setOrders(prev => prev.map(o =>
              o.id === orderId ? { ...o, status: 'published' as FrameOrderStatus } : o
            ));
            setShowPublishModal(false);
            setPublishingOrder(null);
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// Order Card Component
// ==========================================

interface OrderCardProps {
  order: FrameOrder;
  isAdmin: boolean;
  onUpdateStatus: (id: string, status: FrameOrderStatus) => void;
  onDelete: (id: string) => void;
  onView: () => void;
  onDownloadLandscape: (order: FrameOrder) => void;
  onDownloadPortrait: (order: FrameOrder) => void;
  onEdit: (order: FrameOrder) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isAdmin,
  onUpdateStatus,
  onDelete,
  onView,
  onDownloadLandscape,
  onDownloadPortrait,
  onEdit
}) => {
  const statusColors = ORDER_STATUS_COLORS[order.status];
  
  return (
    <div className={`bg-white rounded-xl border-2 ${statusColors.border} p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {order.thumbnail_url ? (
              <img src={order.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="w-6 h-6 text-gray-300" />
              </div>
            )}
          </div>
          
          <div>
            {/* Order Number */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-gray-900">{order.order_number}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                {statusColors.label}
              </span>
              {order.status === 'publish_requested' && (
                <span className="flex items-center gap-1 text-yellow-600 text-xs">
                  <Star className="w-3 h-3 fill-yellow-500" />
                  בקשה לפרסום
                </span>
              )}
            </div>
            
            {/* Client Info */}
            <p className="text-sm text-gray-600">
              {order.client_name || order.user_name || order.user_email}
            </p>
            
            {/* Date */}
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(order.created_at).toLocaleDateString('he-IL')}
              </span>
              {order.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  אירוע: {new Date(order.event_date).toLocaleDateString('he-IL')}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Status Change */}
          {order.status === 'pending' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'completed')}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              סמן כהושלם
            </button>
          )}
          
          {/* Publish Request Actions (Admin Only) */}
          {isAdmin && order.status === 'publish_requested' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'published')}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
            >
              <Upload className="w-4 h-4" />
              אשר ופרסם
            </button>
          )}

          {/* Edit Button */}
          <button
            onClick={() => onEdit(order)}
            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
            title="ערוך הזמנה"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Download Buttons - Landscape & Portrait */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDownloadLandscape(order)}
              className="flex items-center gap-1 px-2 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors text-xs"
              title="הורד רוחב (2500x1875)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-indigo-600">רוחב</span>
            </button>
            {order.thumbnail_portrait_url && (
              <button
                onClick={() => onDownloadPortrait(order)}
                className="flex items-center gap-1 px-2 py-1.5 hover:bg-purple-50 rounded-lg transition-colors text-xs"
                title="הורד אורך (1875x2500)"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-purple-600">אורך</span>
              </button>
            )}
          </div>
          
          <button
            onClick={onView}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="צפה בפרטים"
          >
            <Eye className="w-4 h-4 text-gray-500" />
          </button>
          
          <button
            onClick={() => onDelete(order.id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="מחק הזמנה"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Order Details Modal
// ==========================================

interface OrderDetailsModalProps {
  order: FrameOrder;
  isAdmin: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: FrameOrderStatus) => void;
  onDownloadLandscape: (order: FrameOrder) => void;
  onDownloadPortrait: (order: FrameOrder) => void;
  onPublish: (order: FrameOrder) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isAdmin,
  onClose,
  onUpdateStatus,
  onDownloadLandscape,
  onDownloadPortrait,
  onPublish
}) => {
  const statusColors = ORDER_STATUS_COLORS[order.status];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-lg">{order.order_number}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
              {statusColors.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Thumbnail */}
          {order.thumbnail_url && (
            <div className="mb-6">
              <img 
                src={order.thumbnail_url} 
                alt="תצוגה מקדימה"
                className="w-full max-h-64 object-contain bg-gray-100 rounded-xl"
              />
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">מזמין</p>
              <p className="font-medium">{order.client_name || order.user_name}</p>
              <p className="text-sm text-gray-600">{order.user_email}</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">תאריך הזמנה</p>
              <p className="font-medium">
                {new Date(order.created_at).toLocaleDateString('he-IL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            
            {order.event_date && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">תאריך אירוע</p>
                <p className="font-medium">
                  {new Date(order.event_date).toLocaleDateString('he-IL')}
                </p>
              </div>
            )}
            
            {order.completed_at && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 mb-1">הושלם בתאריך</p>
                <p className="font-medium text-green-700">
                  {new Date(order.completed_at).toLocaleDateString('he-IL')}
                </p>
              </div>
            )}
          </div>

          {/* Publish Request Info */}
          {order.status === 'publish_requested' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">בקשה לפרסום במאגר</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    הצלם ביקש לפרסם מסגרת זו במאגר הציבורי של האתר.
                    {order.publish_requested_at && (
                      <span className="block mt-1">
                        הוגשה ב-{new Date(order.publish_requested_at).toLocaleDateString('he-IL')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">הערות</p>
              <p className="p-3 bg-gray-50 rounded-lg">{order.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {order.status === 'pending' && (
              <button
                onClick={() => onUpdateStatus(order.id, 'completed')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                סמן כהושלם
              </button>
            )}
            
            {order.status === 'completed' && !order.publish_requested_at && (
              <button
                onClick={() => onUpdateStatus(order.id, 'publish_requested')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600"
              >
                <Star className="w-4 h-4" />
                בקש פרסום במאגר
              </button>
            )}
            
            {isAdmin && order.status === 'publish_requested' && (
              <>
                <button
                  onClick={() => onPublish(order)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                >
                  <Upload className="w-4 h-4" />
                  אשר ופרסם למאגר
                </button>
                <button
                  onClick={() => onUpdateStatus(order.id, 'completed')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                  דחה בקשה
                </button>
              </>
            )}
            
            <button
              onClick={() => onDownloadLandscape(order)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              <Download className="w-4 h-4" />
              הורד רוחב
            </button>
            {order.thumbnail_portrait_url && (
              <button
                onClick={() => onDownloadPortrait(order)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
              >
                <Download className="w-4 h-4" />
                הורד אורך
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Publish Frame Modal
// ==========================================

interface PublishFrameModalProps {
  order: FrameOrder;
  categories: Category[];
  onClose: () => void;
  onPublished: (orderId: string) => void;
}

const PublishFrameModal: React.FC<PublishFrameModalProps> = ({
  order,
  categories,
  onClose,
  onPublished
}) => {
  const [name, setName] = useState(`מסגרת ${order.order_number}`);
  const [categoryId, setCategoryId] = useState<string>('');
  const [tags, setTags] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      const result = await publishFrameFromOrder({
        orderId: order.id,
        categoryId: categoryId || undefined,
        name: name.trim() || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
      });

      if (result.success) {
        onPublished(order.id);
      } else {
        setError(result.error || 'שגיאה בפרסום המסגרת');
      }
    } catch (err) {
      setError('שגיאה בלתי צפויה');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Upload className="w-5 h-5" />
            פרסום לגלריה הציבורית
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Thumbnail Preview */}
          {order.thumbnail_url && (
            <div className="mb-4">
              <img 
                src={order.thumbnail_url} 
                alt="תצוגה מקדימה"
                className="w-full h-40 object-contain bg-gray-100 rounded-xl"
              />
            </div>
          )}

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם המסגרת
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="שם להצגה בגלריה"
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קטגוריה
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">בחר קטגוריה...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline ml-1" />
              תגיות (מופרדות בפסיק)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="חתונה, אלגנטי, זהב..."
            />
          </div>

          {/* Creator Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="text-gray-600">
              <span className="font-medium">יוצר:</span> {order.user_name || order.user_email}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              המסגרת תפורסם למשך 6 חודשים בגלריה הציבורית
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מפרסם...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  פרסם לגלריה
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersManagementPage;
