// ==========================================
// ClientManagementPage - ניהול לקוחות צד שלישי
// ==========================================

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Mail, Calendar, Trash2, 
  Copy, CheckCircle, X, AlertCircle,
  UserPlus, Send, Loader2
} from 'lucide-react';
import { supabaseClient, sendWelcomeEmail } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

interface ThirdPartyClient {
  id: string;
  email: string;
  name: string;
  client_name: string;
  event_date: string | null;
  photographer_id: string;
  created_at: string;
  is_active: boolean;
}

export const ClientManagementPage: React.FC = () => {
  const { user } = useAuthContext();
  const [clients, setClients] = useState<ThirdPartyClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load clients
  useEffect(() => {
    loadClients();
  }, [user]);

  const loadClients = async () => {
    if (!user || !supabaseClient) return;
    
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabaseClient as any)
        .from('users')
        .select('*')
        .eq('role', 'client')
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('האם למחוק את הלקוח? כל ההזמנות שלו יימחקו גם.')) return;
    if (!user || !supabaseClient) return;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabaseClient as any)
        .from('users')
        .delete()
        .eq('id', clientId)
        .eq('photographer_id', user.id); // Safety: only own clients
      
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter clients
  const filteredClients = clients.filter(client =>
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">לקוחות צד שלישי</h1>
              <p className="text-sm text-gray-500">{clients.length} לקוחות</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            יצירת לקוח חדש
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-6">
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש לפי מייל או שם..."
            className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Clients List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין לקוחות עדיין</h3>
            <p className="text-gray-500 mb-4">צור לקוח חדש כדי להתחיל</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              יצירת לקוח חדש
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map(client => (
              <div
                key={client.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {client.client_name?.charAt(0) || client.email.charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.client_name || 'לקוח'}</h3>
                      
                      {/* Email with copy */}
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{client.email}</span>
                        <button
                          onClick={() => copyToClipboard(client.email, client.id + '-email')}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="העתק מייל"
                        >
                          {copiedId === client.id + '-email' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      
                      {/* Event Date */}
                      {client.event_date && (
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(client.event_date).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                      )}
                      
                      {/* Created */}
                      <p className="text-xs text-gray-400 mt-2">
                        נוצר ב-{new Date(client.created_at).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(`שם משתמש: ${client.email}\nסיסמה: 123456`, client.id + '-creds')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="העתק פרטי התחברות"
                    >
                      {copiedId === client.id + '-creds' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          הועתק!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          פרטי כניסה
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="מחק לקוח"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      {showCreateModal && (
        <CreateClientModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadClients}
          photographerId={user?.id || ''}
          photographerName={user?.user_metadata?.name || user?.email?.split('@')[0] || 'הצלם'}
          photographerBusiness={user?.user_metadata?.business_name}
        />
      )}
    </div>
  );
};

// ==========================================
// Create Client Modal
// ==========================================

interface CreateClientModalProps {
  onClose: () => void;
  onCreated: () => void;
  photographerId: string;
  photographerName?: string;
  photographerBusiness?: string;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  onClose,
  onCreated,
  photographerId,
  photographerName = 'הצלם שלך',
  photographerBusiness
}) => {
  const [email, setEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [createdClient, setCreatedClient] = useState<{ email: string } | null>(null);

  const DEFAULT_PASSWORD = '123456';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!email || !clientName) {
      setError('נא למלא מייל ושם לקוח');
      return;
    }
    
    if (!email.includes('@')) {
      setError('כתובת מייל לא תקינה');
      return;
    }

    if (!supabaseClient) {
      setError('שגיאה בחיבור לשרת');
      return;
    }

    try {
      setLoading(true);

      // Check if email already exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabaseClient as any)
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();
      
      if (existing) {
        setError('משתמש עם מייל זה כבר קיים במערכת');
        return;
      }

      // Create user in Supabase Auth with fixed password
      let authUserId: string | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: authData, error: authError } = await (supabaseClient as any).auth.admin.createUser({
          email: email.toLowerCase(),
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            name: clientName,
            role: 'client'
          }
        });

        if (!authError && authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch (authErr) {
        // If admin API not available, create directly in users table
        console.log('Admin API not available, creating user directly');
      }

      // Create user record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabaseClient as any)
        .from('users')
        .insert({
          id: authUserId || crypto.randomUUID(),
          email: email.toLowerCase(),
          name: clientName,
          client_name: clientName,
          role: 'client',
          photographer_id: photographerId,
          event_date: eventDate || null,
          is_active: true
        });

      if (dbError) throw dbError;

      // Send welcome email with credentials
      setSendingEmail(true);
      try {
        const emailResult = await sendWelcomeEmail({
          clientEmail: email.toLowerCase(),
          clientName,
          photographerName,
          photographerBusiness,
          eventDate: eventDate || undefined,
          password: DEFAULT_PASSWORD
        });
        
        setEmailSent(emailResult.success);
        if (!emailResult.success) {
          console.warn('Email failed but client created:', emailResult.error);
        }
      } catch (emailErr) {
        console.warn('Email sending failed but client created:', emailErr);
        setEmailSent(false);
      } finally {
        setSendingEmail(false);
      }

      setCreatedClient({ email: email.toLowerCase() });
      setSuccess(true);
      onCreated();
      
    } catch (err: any) {
      console.error('Error creating client:', err);
      setError(err.message || 'שגיאה ביצירת הלקוח');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`שם משתמש: ${email}\nסיסמה: ${DEFAULT_PASSWORD}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">יצירת לקוח חדש</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          // Success State
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">הלקוח נוצר בהצלחה!</h3>
            
            {/* Email Status */}
            {sendingEmail ? (
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>שולח מייל...</span>
              </div>
            ) : emailSent ? (
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <Mail className="w-4 h-4" />
                <span>מייל נשלח ל-{createdClient?.email}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-yellow-600 mb-4">
                <AlertCircle className="w-4 h-4" />
                <span>המייל לא נשלח - העתק את הפרטים ושלח ידנית</span>
              </div>
            )}
            
            {/* Credentials Box */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-right">
              <p className="text-sm text-gray-500 mb-2">פרטי התחברות:</p>
              <p className="font-mono text-sm">
                <span className="text-gray-500">שם משתמש:</span>{' '}
                <span className="text-gray-900">{createdClient?.email}</span>
              </p>
              <p className="font-mono text-sm">
                <span className="text-gray-500">סיסמה:</span>{' '}
                <span className="text-gray-900">{DEFAULT_PASSWORD}</span>
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={copyCredentials}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
                העתק פרטים
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                סגור
              </button>
            </div>
          </div>
        ) : (
          // Form State
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Email = Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מייל (ישמש גם כשם משתמש)
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="client@email.com"
                  required
                />
              </div>
            </div>

            {/* Client Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם הלקוח
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="ישראל ישראלי"
                required
              />
            </div>

            {/* Event Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תאריך אירוע (אופציונלי)
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-indigo-50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Send className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-700">
                  <p className="font-medium mb-1">מה קורה אחרי יצירה?</p>
                  <ul className="list-disc list-inside space-y-1 text-indigo-600">
                    <li>נשלח מייל ללקוח עם פרטי התחברות</li>
                    <li>סיסמה קבועה: 123456</li>
                    <li>הלקוח יוכל להיכנס ולעצב מסגרות</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  יוצר...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  צור לקוח ושלח מייל
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClientManagementPage;
