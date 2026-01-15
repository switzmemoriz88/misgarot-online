import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSupabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  event_date?: string;
  event_venue?: string;
  design_status: string;
  created_at: string;
}

interface Design {
  id: string;
  client_name: string;
  client_email: string;
  landscape_data: Record<string, unknown> | null;
  portrait_data: Record<string, unknown> | null;
  landscape_png_url: string | null;
  portrait_png_url: string | null;
  status: string;
  created_at: string;
}

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, user } = useAuthContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'designs' | 'clients'>('designs');
  
  // Get display name - prefer full name, then business_name, then email
  const displayName = 
    profile?.name ||
    user?.user_metadata?.full_name ||
    profile?.business_name || 
    user?.user_metadata?.business_name ||
    user?.email?.split('@')[0] ||
    'שלך';

  useEffect(() => {
    fetchClients();
    fetchDesigns();
    checkAdminRole();
  }, []);

  const fetchDesigns = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('designs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching designs:', error);
        return;
      }
      
      setDesigns(data || []);
    } catch (err) {
      console.error('Failed to fetch designs:', err);
    }
  };

  // Download PNG file
  const handleDownloadPng = async (url: string | null, filename: string) => {
    if (!url) {
      alert('קובץ לא זמין');
      return;
    }
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed:', err);
      alert('שגיאה בהורדת הקובץ');
    }
  };

  const checkAdminRole = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const userData = data as { role: string } | null;
    setIsAdmin(userData?.role === 'admin');
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      open: 'badge-open',
      in_progress: 'badge-in-progress',
      submitted: 'badge-submitted',
      archived: 'badge-archived',
    };
    return badges[status] || 'badge';
  };

  const stats = {
    total: clients.length,
    pending: clients.filter(c => c.design_status === 'in_progress').length,
    completed: clients.filter(c => c.design_status === 'submitted').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30" dir="rtl">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
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
                <span className="font-medium">ראשי</span>
              </button>
              
              <div className="h-6 w-px bg-gray-200"></div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-800">{t('dashboard.title')}</h1>
                <p className="text-xs text-gray-500">{t('dashboard.welcome', { name: displayName })}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-xl transition-all"
                >
                  <span>🛡️</span>
                  <span className="hidden sm:inline">ניהול</span>
                </button>
              )}
              <button
                onClick={() => navigate('/categories')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 transition-all"
              >
                <span>🎨</span>
                <span>עיצוב חדש</span>
              </button>
              <button
                onClick={() => navigate('/clients')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all"
              >
                <span>+</span>
                <span className="hidden sm:inline">{t('dashboard.newClient')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Quick Actions - New! */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => navigate('/categories')}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <span className="text-3xl">🎨</span>
            <span className="font-medium">עיצוב חדש</span>
          </button>
          
          <button
            onClick={() => navigate('/my-clients')}
            className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <span className="text-3xl">👥</span>
            <span className="font-medium text-gray-700">לקוחות שלי</span>
          </button>
          
          <button
            onClick={() => navigate('/my-orders')}
            className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <span className="text-3xl">📦</span>
            <span className="font-medium text-gray-700">הזמנות</span>
          </button>
          
          <button
            onClick={() => navigate('/clients')}
            className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-300 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <span className="text-3xl">➕</span>
            <span className="font-medium text-gray-700">לקוח חדש</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-3xl font-bold text-indigo-600">{designs.length}</div>
            <div className="text-gray-600">עיצובים שנשלחו</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
            <div className="text-gray-600">{t('dashboard.totalClients')}</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-gray-600">{t('dashboard.pendingDesigns')}</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-gray-600">{t('dashboard.completedDesigns')}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('designs')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'designs'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🎨 עיצובים ({designs.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'clients'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👥 לקוחות ({clients.length})
          </button>
        </div>

        {/* Designs Grid */}
        {activeTab === 'designs' && (
          <div className="mb-8">
            {designs.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">אין עיצובים עדיין</h3>
                <p className="text-gray-600 mb-4">צור עיצוב חדש ושלח ללקוחות שלך</p>
                <button
                  onClick={() => navigate('/categories')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl"
                >
                  🎨 צור עיצוב חדש
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {designs.map((design) => (
                  <div key={design.id} className="card hover:shadow-lg transition-shadow">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-800">{design.client_name}</h3>
                        <p className="text-sm text-gray-500">{design.client_email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        design.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        design.status === 'approved' ? 'bg-green-100 text-green-700' :
                        design.status === 'printed' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {design.status === 'sent' ? 'נשלח' :
                         design.status === 'approved' ? 'אושר' :
                         design.status === 'printed' ? 'הודפס' : design.status}
                      </span>
                    </div>
                    
                    {/* Date */}
                    <p className="text-xs text-gray-400 mb-4">
                      {new Date(design.created_at).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    
                    {/* Download Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadPng(
                          design.portrait_png_url,
                          `${design.client_name}_portrait.png`
                        )}
                        disabled={!design.portrait_png_url}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          design.portrait_png_url
                            ? 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span>📱</span>
                        <span>הורד אורך</span>
                      </button>
                      <button
                        onClick={() => handleDownloadPng(
                          design.landscape_png_url,
                          `${design.client_name}_landscape.png`
                        )}
                        disabled={!design.landscape_png_url}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          design.landscape_png_url
                            ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span>🖼️</span>
                        <span>הורד רוחב</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clients Table */}
        {activeTab === 'clients' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.clients')}</h2>
          
          {clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('common.noResults')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-start py-3 px-4 font-medium text-gray-600">{t('client.name')}</th>
                    <th className="text-start py-3 px-4 font-medium text-gray-600">{t('client.email')}</th>
                    <th className="text-start py-3 px-4 font-medium text-gray-600">{t('client.eventDate')}</th>
                    <th className="text-start py-3 px-4 font-medium text-gray-600">סטטוס</th>
                    <th className="text-start py-3 px-4 font-medium text-gray-600">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{client.name}</td>
                      <td className="py-3 px-4" dir="ltr">{client.email}</td>
                      <td className="py-3 px-4">
                        {client.event_date ? new Date(client.event_date).toLocaleDateString('he-IL') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${getStatusBadge(client.design_status)}`}>
                          {t(`client.status.${client.design_status}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/editor/${client.id}`)}
                          className="text-indigo-600 hover:underline text-sm"
                        >
                          {t('common.edit')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
      </div>
      
      {/* Quick Navigation Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-lg rounded-full shadow-lg border border-gray-200 px-3 py-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <span>🏠</span>
            <span className="font-medium text-sm hidden sm:inline">ראשי</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-md"
          >
            <span>📊</span>
            <span className="font-medium text-sm">דשבורד</span>
          </button>
          <button
            onClick={() => navigate('/categories')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <span>🎨</span>
            <span className="font-medium text-sm hidden sm:inline">עיצוב</span>
          </button>
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <span>👥</span>
            <span className="font-medium text-sm hidden sm:inline">לקוחות</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
