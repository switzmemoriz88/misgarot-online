// ==========================================
// 👥 Clients Page - ניהול לקוחות לצלם
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts';
import { getSupabase } from '@/lib/supabase/client';

// Types
interface Client {
  id: string;
  email: string;
  name: string;
  event_date?: string;
  event_venue?: string;
  created_at: string;
  orders_count?: number;
}

interface ClientOrder {
  id: string;
  order_number: string;
  couple_names: string;
  event_date: string;
  event_venue: string;
  status: string;
  created_at: string;
  landscape_png_url?: string;
  portrait_png_url?: string;
}

const ClientsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'clients' | 'orders'>('clients');
  
  // Share Link Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  
  // Form state
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEventDate, setNewClientEventDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch clients
  useEffect(() => {
    fetchClients();
    fetchOrders();
  }, []);

  const fetchClients = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching clients...');
      // Fetch all clients (role = 'client')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false });

      console.log('Clients result:', data, error);
      
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('client_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist yet
        console.log('client_orders table may not exist yet');
      }
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    }
  };

  // Create new client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const supabase = getSupabase();
    if (!supabase) {
      setError('שגיאת חיבור ל-Supabase');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Creating client:', newClientEmail, newClientName);
      
      // Generate magic link token
      const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
      
      // Create client with magic link token
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: createError } = await (supabase as any)
        .from('users')
        .insert({
          email: newClientEmail,
          name: newClientName,
          role: 'client',
          is_active: true,
          event_date: newClientEventDate || null,
          magic_link_token: token,
          magic_link_expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      console.log('Result:', data, createError);

      if (createError) {
        // Check if duplicate email error
        if (createError.code === '23505') {
          setError('לקוח עם אימייל זה כבר קיים במערכת');
        } else {
          setError(`שגיאה: ${createError.message}`);
        }
        return;
      }
      
      // Generate magic link URL - use client-welcome for token verification
      const magicLink = `${window.location.origin}/client-welcome?token=${token}`;
      console.log('Magic Link:', magicLink);
      
      // Send email via Edge Function
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userWithExtra = user as any;
        const { error: emailError } = await supabase.functions.invoke('send-magic-link', {
          body: {
            to: newClientEmail,
            clientName: newClientName,
            magicLink: magicLink,
            photographerName: userWithExtra?.name || userWithExtra?.business_name || 'הצלם שלך',
            eventDate: newClientEventDate || null,
          },
        });
        
        if (emailError) {
          console.error('Email error:', emailError);
          // Client created but email failed - still show success with note
          setSuccess(`הלקוח ${newClientName} נוצר! שגיאה בשליחת המייל - העתק את הקישור מה-Console`);
        } else {
          setSuccess(`הלקוח ${newClientName} נוצר בהצלחה! קישור גישה נשלח ל-${newClientEmail}`);
        }
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
        setSuccess(`הלקוח ${newClientName} נוצר! (המייל לא נשלח - בדוק Console)`);
      }
      
      setNewClientEmail('');
      setNewClientName('');
      setNewClientEventDate('');
      setShowAddModal(false);
      fetchClients();

    } catch (err: unknown) {
      console.error('Error creating client:', err);
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? (err as { message: string }).message 
        : 'שגיאה לא ידועה';
      setError(`שגיאה: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete client
  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הלקוח?')) return;

    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      fetchClients();
    } catch (err) {
      console.error('Error deleting client:', err);
      alert('שגיאה במחיקת הלקוח');
    }
  };

  // Send magic link
  const handleResendLink = async (client: Client) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const token = crypto.randomUUID() + crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({
          magic_link_token: token,
          magic_link_expires_at: expiresAt.toISOString(),
        })
        .eq('id', client.id);

      // TODO: Send email
      alert(`קישור חדש נשלח ל-${client.email}`);
    } catch (err) {
      console.error('Error resending link:', err);
      alert('שגיאה בשליחת הקישור');
    }
  };

  // Open share link modal
  const handleShareLink = async (client: Client) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      // Generate new token if needed or use existing one
      const token = crypto.randomUUID() + crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Update token in database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({
          magic_link_token: token,
          magic_link_expires_at: expiresAt.toISOString(),
        })
        .eq('id', client.id);

      const magicLink = `${window.location.origin}/client-welcome?token=${token}`;
      
      // Format event date if exists
      const eventDateFormatted = client.event_date 
        ? new Date(client.event_date).toLocaleDateString('he-IL')
        : '';

      // Prepare default message template
      const defaultMessage = `שלום ${client.name}! 🎉

הכנתי לכם קישור לעיצוב מסגרת המגנטים לאירוע שלכם${eventDateFormatted ? ` (${eventDateFormatted})` : ''}.

לחצו על הקישור, בחרו מסגרת שאתם אוהבים, הוסיפו את השמות ושלחו לי לאישור:

${magicLink}

הקישור תקף ל-7 ימים.
בהצלחה! 💒`;

      setSelectedClient({ ...client, magic_link_token: token } as Client & { magic_link_token: string });
      setShareMessage(defaultMessage);
      setLinkCopied(false);
      setMessageCopied(false);
      setShowShareModal(true);
    } catch (err) {
      console.error('Error generating share link:', err);
      alert('שגיאה ביצירת הקישור');
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, type: 'link' | 'message') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } else {
        setMessageCopied(true);
        setTimeout(() => setMessageCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('לא ניתן להעתיק - נסה שוב');
    }
  };

  // Get magic link URL from selected client
  const getMagicLinkUrl = () => {
    if (!selectedClient) return '';
    const clientWithToken = selectedClient as Client & { magic_link_token?: string };
    return clientWithToken.magic_link_token 
      ? `${window.location.origin}/client-welcome?token=${clientWithToken.magic_link_token}`
      : '';
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'ממתין לאישור', color: 'bg-yellow-100 text-yellow-700' },
      approved: { label: 'אושר', color: 'bg-green-100 text-green-700' },
      rejected: { label: 'נדחה', color: 'bg-red-100 text-red-700' },
      in_progress: { label: 'בעבודה', color: 'bg-blue-100 text-blue-700' },
      ready: { label: 'מוכן', color: 'bg-purple-100 text-purple-700' },
      printed: { label: 'הודפס', color: 'bg-indigo-100 text-indigo-700' },
      delivered: { label: 'נמסר', color: 'bg-gray-100 text-gray-700' },
    };
    const badge = badges[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all group"
              >
                <svg 
                  className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">דשבורד</span>
              </button>
            </div>
            
            <h1 className="text-xl font-bold text-gray-800">👥 ניהול לקוחות</h1>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
            >
              <span>➕</span>
              <span>לקוח חדש</span>
            </button>
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      {success && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <span>✅</span>
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="mr-auto text-green-500 hover:text-green-700">✕</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'clients'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👥 לקוחות ({clients.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📦 הזמנות ({orders.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'clients' ? (
          /* Clients List */
          clients.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">אין לקוחות עדיין</h3>
              <p className="text-gray-500 mb-6">הוסף את הלקוח הראשון שלך ושלח לו קישור לעיצוב</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
              >
                <span>➕</span>
                <span>הוסף לקוח</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {clients.map(client => (
                <div
                  key={client.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xl font-bold">
                        {client.name.charAt(0)}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{client.name}</h3>
                        <p className="text-gray-500 text-sm" dir="ltr">{client.email}</p>
                      </div>

                      {/* Event Date Badge */}
                      {client.event_date && (
                        <div className="flex flex-col items-center px-4 py-2 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
                          <span className="text-2xl">💒</span>
                          <span className="text-sm font-bold text-pink-600">{formatDate(client.event_date)}</span>
                          {client.event_venue && (
                            <span className="text-xs text-pink-400 truncate max-w-[120px]">{client.event_venue}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 mr-4">
                      <button
                        onClick={() => handleShareLink(client)}
                        className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-md transition-all flex items-center gap-2 font-medium text-sm"
                        title="שתף קישור ידנית"
                      >
                        <span>🔗</span>
                        <span>שתף קישור</span>
                      </button>
                      <button
                        onClick={() => handleResendLink(client)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="שלח קישור מחדש במייל"
                      >
                        📧
                      </button>
                      <button
                        onClick={() => navigate(`/editor?client=${client.id}`)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="צור עיצוב"
                      >
                        🎨
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="מחק לקוח"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Orders List */
          orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">אין הזמנות עדיין</h3>
              <p className="text-gray-500">כאשר לקוחות ישלחו עיצובים, הם יופיעו כאן</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                >
                  {/* Order Header with Event Date */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💒</span>
                      <div className="text-white">
                        <div className="font-bold text-lg">{order.couple_names}</div>
                        <div className="text-white/80 text-sm flex items-center gap-2">
                          <span>📅 {formatDate(order.event_date)}</span>
                          {order.event_venue && (
                            <>
                              <span>•</span>
                              <span>📍 {order.event_venue}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white/60 text-sm">{order.order_number}</span>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                  
                  {/* Order Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        {/* Thumbnails */}
                        <div className="flex gap-2">
                          {order.landscape_png_url && (
                            <div className="relative group">
                              <img
                                src={order.landscape_png_url}
                                alt="רוחב"
                                className="w-24 h-16 object-cover rounded-lg border shadow-sm group-hover:shadow-md transition-all"
                              />
                              <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">רוחב</span>
                            </div>
                          )}
                          {order.portrait_png_url && (
                            <div className="relative group">
                              <img
                                src={order.portrait_png_url}
                                alt="אורך"
                                className="w-12 h-18 object-cover rounded-lg border shadow-sm group-hover:shadow-md transition-all"
                              />
                              <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">אורך</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Order Info */}
                        <div>
                          <p className="text-gray-400 text-xs">
                            נוצר ב-{formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                    
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          👁️ צפה
                        </button>
                        <button
                          className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          ⬇️ הורד
                        </button>
                        <button
                          className="px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          ✏️ ערוך
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h2 className="text-xl font-bold">➕ הוספת לקוח חדש</h2>
              <p className="text-white/80 text-sm mt-1">
                הלקוח יקבל קישור למייל לכניסה למערכת
              </p>
            </div>
            
            {/* Form */}
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם הזוג <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="לדוגמה: דנה ויוסי"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תאריך האירוע <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newClientEventDate}
                  onChange={(e) => setNewClientEventDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  אימייל <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  dir="ltr"
                  required
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">💡 מה יקרה?</p>
                <ul className="space-y-1 text-blue-600">
                  <li>• הלקוח יקבל מייל עם קישור גישה</li>
                  <li>• הלקוח יוכל לבחור מסגרת ולעצב</li>
                  <li>• תקבל התראה כשהלקוח ישלח עיצוב</li>
                </ul>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>יוצר...</span>
                    </span>
                  ) : (
                    'צור לקוח ושלח קישור'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {showShareModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>🔗</span>
                שתף קישור ללקוח
              </h2>
              <p className="text-white/80 text-sm mt-1">
                העתק את הקישור או ההודעה ושלח ללקוח בוואטסאפ/SMS
              </p>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Client Info */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{selectedClient.name}</p>
                  <p className="text-sm text-gray-500">{selectedClient.email}</p>
                </div>
              </div>

              {/* Magic Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔗 קישור גישה
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getMagicLinkUrl()}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600 font-mono"
                    dir="ltr"
                  />
                  <button
                    onClick={() => copyToClipboard(getMagicLinkUrl(), 'link')}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      linkCopied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {linkCopied ? '✓ הועתק!' : '📋 העתק'}
                  </button>
                </div>
              </div>

              {/* Message Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 הודעה מוכנה לשליחה
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm resize-none"
                  placeholder="ערוך את ההודעה כרצונך..."
                />
                <button
                  onClick={() => copyToClipboard(shareMessage, 'message')}
                  className={`w-full mt-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    messageCopied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
                  }`}
                >
                  {messageCopied ? '✓ ההודעה הועתקה!' : '📋 העתק את כל ההודעה'}
                </button>
              </div>

              {/* WhatsApp Quick Share */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-sm font-medium text-green-800 mb-2">💡 שליחה מהירה</p>
                <p className="text-xs text-green-600 mb-3">
                  לחץ להעתקה ואז פתח וואטסאפ או שלח ב-SMS
                </p>
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center text-sm font-medium"
                  >
                    📱 פתח וואטסאפ
                  </a>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedClient(null);
                }}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
