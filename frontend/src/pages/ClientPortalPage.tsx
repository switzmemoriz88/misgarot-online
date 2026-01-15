// ==========================================
// ClientPortalPage - פאנל הלקוח
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Download, Clock, Check, Calendar, 
  Image, LogOut, User, Star
} from 'lucide-react';
import { supabaseClient } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

// Types
type OrderStatus = 'pending' | 'completed' | 'publish_requested' | 'published' | 'cancelled';

const STATUS_CONFIG: Record<OrderStatus, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  pending: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    label: 'בהכנה',
    icon: <Clock className="w-4 h-4" />
  },
  completed: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    label: 'מוכן להורדה',
    icon: <Check className="w-4 h-4" />
  },
  publish_requested: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    label: 'ממתין לאישור פרסום',
    icon: <Star className="w-4 h-4" />
  },
  published: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    label: 'פורסם בגלריה',
    icon: <Star className="w-4 h-4 fill-purple-500" />
  },
  cancelled: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    label: 'בוטל',
    icon: null
  }
};

interface ClientOrder {
  id: string;
  order_number: string;
  thumbnail_url: string | null;
  status: OrderStatus;
  completed_at: string | null;
  downloaded_at: string | null;
  created_at: string;
  notes: string | null;
}

const ClientPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, logout, isLoading: authLoading } = useAuthContext();
  
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Check if user is a client
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Load client orders
  useEffect(() => {
    const loadOrders = async () => {
      if (!user || !supabaseClient) return;

      try {
        setLoading(true);
        const { data, error } = await (supabaseClient as any)
          .from('frame_orders')
          .select('id, order_number, thumbnail_url, status, completed_at, downloaded_at, created_at, notes')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Error loading orders:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  // Handle download
  const handleDownload = async (order: ClientOrder) => {
    if (!order.thumbnail_url) return;

    setDownloading(order.id);

    try {
      // Create download link
      const link = document.createElement('a');
      link.href = order.thumbnail_url;
      link.download = `frame_${order.order_number}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update downloaded_at
      if (supabaseClient) {
        await (supabaseClient as any)
          .from('frame_orders')
          .update({ downloaded_at: new Date().toISOString() })
          .eq('id', order.id);

        // Update local state
        setOrders(prev => prev.map(o =>
          o.id === order.id ? { ...o, downloaded_at: new Date().toISOString() } : o
        ));
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('שגיאה בהורדה');
    } finally {
      setDownloading(null);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const readyOrders = orders.filter(o => ['completed', 'published', 'publish_requested'].includes(o.status));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">
                שלום, {profile?.name || 'לקוח'}
              </h1>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            יציאה
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{pendingOrders.length}</span>
            </div>
            <p className="text-gray-600 text-sm">מסגרות בהכנה</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{readyOrders.length}</span>
            </div>
            <p className="text-gray-600 text-sm">מוכנות להורדה</p>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              ההזמנות שלי
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">אין הזמנות עדיין</h3>
              <p className="text-gray-500 text-sm">ההזמנות שלך יופיעו כאן</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map(order => {
                const status = STATUS_CONFIG[order.status];
                const canDownload = order.status !== 'pending' && order.status !== 'cancelled' && order.thumbnail_url;

                return (
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {order.thumbnail_url ? (
                          <img 
                            src={order.thumbnail_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-gray-900">
                            {order.order_number}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.bg} ${status.text}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(order.created_at).toLocaleDateString('he-IL')}
                          </span>
                          {order.downloaded_at && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Download className="w-3.5 h-3.5" />
                              הורד
                            </span>
                          )}
                        </div>

                        {order.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                            {order.notes}
                          </p>
                        )}
                      </div>

                      {/* Download Button */}
                      {canDownload && (
                        <button
                          onClick={() => handleDownload(order)}
                          disabled={downloading === order.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {downloading === order.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          הורד
                        </button>
                      )}

                      {order.status === 'pending' && (
                        <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm">
                          <Clock className="w-4 h-4 inline ml-1" />
                          בהכנה...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Help */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            יש שאלות? פנו לצלם שלכם לקבלת עזרה
          </p>
        </div>
      </main>
    </div>
  );
};

export default ClientPortalPage;
