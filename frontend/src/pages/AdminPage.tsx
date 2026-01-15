// ==========================================
// 🛡️ Admin Panel - פאנל ניהול מנהלים
// ==========================================
// ניהול מלא של מסגרות, קטגוריות, משתמשים ואלמנטים
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getSupabase } from '@/lib/supabase/client';

// ==========================================
// Types
// ==========================================

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription_plan: string;
  designs_count: number;
  clients_count: number;
  created_at: string;
  is_active: boolean;
  is_starred?: boolean; // ⭐ צלם עם הרשאות מיוחדות
}

interface Frame {
  id: string;
  name: string;
  name_en: string;
  category_id: string;
  thumbnail_url: string | null;
  is_premium: boolean;
  is_active: boolean;
  usage_count: number;
  orientation: string;
  paired_frame_id: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  name_en: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
}

interface ElementCategory {
  id: string;
  name: string;
  name_en: string;
  icon: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Element {
  id: string;
  category_id: string | null;
  name: string;
  name_en: string | null;
  image_url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  file_type: string;
  tags: string[] | null;
  is_premium: boolean;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  totalPhotographers: number;
  totalDesigns: number;
  totalFrames: number;
  totalOrders: number;
  activeSubscriptions: number;
}

type Tab = 'dashboard' | 'users' | 'frames' | 'categories' | 'elements' | 'orders';

// ==========================================
// Modal Components
// ==========================================

// Edit Frame Modal
const EditFrameModal = ({ 
  frame, 
  categories,
  onClose, 
  onSave 
}: { 
  frame: Frame; 
  categories: Category[];
  onClose: () => void; 
  onSave: (updates: Partial<Frame>) => void;
}) => {
  const [name, setName] = useState(frame.name);
  const [nameEn, setNameEn] = useState(frame.name_en || '');
  const [categoryId, setCategoryId] = useState(frame.category_id);
  const [isPremium, setIsPremium] = useState(frame.is_premium);
  const [isActive, setIsActive] = useState(frame.is_active);

  const handleSave = () => {
    onSave({
      name,
      name_en: nameEn,
      category_id: categoryId,
      is_premium: isPremium,
      is_active: isActive,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[95vw]">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">✏️ עריכת מסגרת</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם (עברית)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם (אנגלית)</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              dir="ltr"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm">💎 פרימיום</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm">✅ פעיל</span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            ביטול
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            שמור שינויים
          </button>
        </div>
      </div>
    </div>
  );
};

// Category Modal (Create/Edit)
const CategoryModal = ({ 
  category, 
  onClose, 
  onSave 
}: { 
  category: Category | null; 
  onClose: () => void; 
  onSave: (data: Partial<Category>) => void;
}) => {
  const [name, setName] = useState(category?.name || '');
  const [nameEn, setNameEn] = useState(category?.name_en || '');
  const [icon, setIcon] = useState(category?.icon || '📁');
  const [isActive, setIsActive] = useState(category?.is_active ?? true);

  const icons = ['💍', '🎂', '📷', '🎉', '👶', '🎓', '💐', '🏠', '✡️', '📁', '🌸', '🎊', '🎈', '🎄'];

  const handleSave = () => {
    onSave({
      name,
      name_en: nameEn,
      icon,
      is_active: isActive,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-[450px] max-w-[95vw]">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">
            {category ? '✏️ עריכת קטגוריה' : '➕ קטגוריה חדשה'}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם (עברית)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="חתונה, בר מצווה..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם (אנגלית)</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Wedding, Bar Mitzvah..."
              dir="ltr"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">אייקון</label>
            <div className="flex flex-wrap gap-2">
              {icons.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                    icon === emoji 
                      ? 'border-purple-500 bg-purple-50 scale-110' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm">✅ קטגוריה פעילה</span>
          </label>
        </div>
        
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            ביטול
          </button>
          <button 
            onClick={handleSave} 
            disabled={!name.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {category ? 'שמור שינויים' : 'צור קטגוריה'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteModal = ({ 
  title, 
  message, 
  onClose, 
  onConfirm 
}: { 
  title: string; 
  message: string;
  onClose: () => void; 
  onConfirm: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
    <div className="bg-white rounded-2xl shadow-2xl w-[400px] max-w-[95vw] p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🗑️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600">{message}</p>
      </div>
      
      <div className="flex gap-3">
        <button 
          onClick={onClose} 
          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          ביטול
        </button>
        <button 
          onClick={() => { onConfirm(); onClose(); }} 
          className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          מחק
        </button>
      </div>
    </div>
  </div>
);

// Upload Element Modal
const UploadElementModal = ({
  categories,
  onClose,
  onUpload,
  isLoading,
}: {
  categories: ElementCategory[];
  onClose: () => void;
  onUpload: (file: File, categoryId: string, name: string, isPremium: boolean) => Promise<void>;
  isLoading: boolean;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [isPremium, setIsPremium] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      // Auto-fill name from filename
      if (!name) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setName(fileName);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !name.trim()) return;
    await onUpload(file, categoryId, name.trim(), isPremium);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[95vw]">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">🎨 העלאת אלמנט חדש</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">קובץ תמונה *</label>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full max-h-48 object-contain bg-gray-100 rounded-lg" />
                <button 
                  onClick={() => { setFile(null); setPreview(''); }}
                  className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                <span className="text-3xl mb-2">📤</span>
                <span className="text-sm text-gray-500">לחץ להעלאה או גרור קובץ</span>
                <span className="text-xs text-gray-400 mt-1">PNG, SVG, WEBP</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/png,image/svg+xml,image/webp"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם האלמנט *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: פרח ורד"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריה</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">ללא קטגוריה</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Premium */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="text-sm">💎 אלמנט פרימיום (למנויים בלבד)</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            ביטול
          </button>
          <button 
            onClick={handleUpload} 
            disabled={!file || !name.trim() || isLoading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                מעלה...
              </>
            ) : (
              <>
                <span>📤</span>
                העלה אלמנט
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    green: 'bg-green-100',
    pink: 'bg-pink-100',
    yellow: 'bg-yellow-100',
    orange: 'bg-orange-100',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Main Component
// ==========================================

// ==========================================
// Main Component
// ==========================================

const AdminPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'dashboard';
  
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [users, setUsers] = useState<User[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Elements state
  const [elements, setElements] = useState<Element[]>([]);
  const [elementCategories, setElementCategories] = useState<ElementCategory[]>([]);
  const [selectedElementCategory, setSelectedElementCategory] = useState<string>('all');
  const [showUploadElement, setShowUploadElement] = useState(false);
  const [uploadingElement, setUploadingElement] = useState(false);
  
  // Modals state
  const [editingFrame, setEditingFrame] = useState<Frame | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'frame' | 'category' | 'element'; id: string; name: string } | null>(null);

  // Update URL when tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      // Always load categories for filters
      const { data: catsData } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      setCategories((catsData as Category[]) || []);

      // Load stats
      if (activeTab === 'dashboard') {
        const [usersRes, designsRes, framesRes, ordersRes, subsRes] = await Promise.all([
          supabase.from('users').select('id, role', { count: 'exact' }),
          supabase.from('designs').select('id', { count: 'exact' }),
          supabase.from('frames').select('id', { count: 'exact' }),
          supabase.from('orders').select('id', { count: 'exact' }),
          supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
        ]);

        const usersData = usersRes.data as { id: string; role: string }[] | null;
        setStats({
          totalUsers: usersRes.count || 0,
          totalPhotographers: usersData?.filter(u => u.role === 'photographer').length || 0,
          totalDesigns: designsRes.count || 0,
          totalFrames: framesRes.count || 0,
          totalOrders: ordersRes.count || 0,
          activeSubscriptions: subsRes.count || 0,
        });
      }

      // Load users
      if (activeTab === 'users') {
        const { data } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        setUsers((data as User[]) || []);
      }

      // Load frames
      if (activeTab === 'frames') {
        const { data } = await supabase
          .from('frames')
          .select('*')
          .order('created_at', { ascending: false });
        setFrames((data as Frame[]) || []);
      }

      // Load elements and element categories
      if (activeTab === 'elements') {
        // Load element categories
        const { data: elCatsData } = await supabase
          .from('element_categories')
          .select('*')
          .order('sort_order');
        setElementCategories((elCatsData as ElementCategory[]) || []);

        // Load elements
        const { data: elementsData } = await supabase
          .from('elements')
          .select('*')
          .order('created_at', { ascending: false });
        setElements((elementsData as Element[]) || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================
  // CRUD Operations
  // ==========================================

  const updateFrame = async (frameId: string, updates: Partial<Frame>) => {
    const supabase = getSupabase();
    if (!supabase) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('frames')
      .update(updates)
      .eq('id', frameId);

    if (error) {
      console.error('Error updating frame:', error);
      alert('שגיאה בעדכון המסגרת');
    } else {
      setFrames(prev => prev.map(f => f.id === frameId ? { ...f, ...updates } as Frame : f));
    }
  };

  const deleteFrame = async (frameId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    // First, delete from storage if there's a thumbnail
    const frame = frames.find(f => f.id === frameId);
    if (frame?.thumbnail_url) {
      try {
        const path = frame.thumbnail_url.split('/frames/')[1];
        if (path) {
          await supabase.storage.from('frames').remove([path]);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    const { error } = await supabase
      .from('frames')
      .delete()
      .eq('id', frameId);

    if (error) {
      console.error('Error deleting frame:', error);
      alert('שגיאה במחיקת המסגרת');
    } else {
      setFrames(prev => prev.filter(f => f.id !== frameId));
    }
  };

  const saveCategory = async (data: Partial<Category>, categoryId?: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    if (categoryId) {
      // Update existing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('categories')
        .update(data)
        .eq('id', categoryId);

      if (error) {
        alert('שגיאה בעדכון הקטגוריה');
      } else {
        setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...data } as Category : c));
      }
    } else {
      // Create new
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newCat, error } = await (supabase as any)
        .from('categories')
        .insert({
          ...data,
          sort_order: categories.length,
        })
        .select()
        .single();

      if (error) {
        alert('שגיאה ביצירת הקטגוריה');
      } else {
        setCategories(prev => [...prev, newCat as Category]);
      }
    }
  };

  const deleteCategory = async (categoryId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Check if category has frames
    const framesInCategory = frames.filter(f => f.category_id === categoryId);
    if (framesInCategory.length > 0) {
      alert(`לא ניתן למחוק קטגוריה עם ${framesInCategory.length} מסגרות. יש להעביר או למחוק אותן קודם.`);
      return;
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      alert('שגיאה במחיקת הקטגוריה');
    } else {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    }
  };

  const toggleFrameStatus = async (frameId: string, isActive: boolean) => {
    await updateFrame(frameId, { is_active: isActive });
  };

  // Toggle user star (special permissions)
  const toggleUserStar = async (userId: string, isStarred: boolean) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('users')
        .update({ is_starred: isStarred })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_starred: isStarred } : u
      ));

      alert(isStarred ? '⭐ הצלם קיבל הרשאות מיוחדות!' : 'הרשאות מיוחדות הוסרו');
    } catch (err) {
      console.error('Error toggling star:', err);
      alert('שגיאה בעדכון הרשאות');
    }
  };

  // ==========================================
  // Elements CRUD
  // ==========================================

  const uploadElement = async (file: File, categoryId: string, name: string, isPremium: boolean) => {
    const supabase = getSupabase();
    if (!supabase) return;

    setUploadingElement(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `elements/${categoryId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('frames')
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('frames').getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      // Get image dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // Insert to database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newElement, error: dbError } = await (supabase as any)
        .from('elements')
        .insert({
          name,
          category_id: categoryId || null,
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          width: img.width,
          height: img.height,
          file_type: fileExt,
          file_size: file.size,
          is_premium: isPremium,
          is_active: true,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setElements(prev => [newElement as Element, ...prev]);
      setShowUploadElement(false);
      alert('✅ האלמנט הועלה בהצלחה!');
    } catch (err) {
      console.error('Error uploading element:', err);
      alert('שגיאה בהעלאת האלמנט');
    } finally {
      setUploadingElement(false);
    }
  };

  const deleteElement = async (elementId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const element = elements.find(e => e.id === elementId);
    if (element?.image_url) {
      try {
        const path = element.image_url.split('/frames/')[1];
        if (path) {
          await supabase.storage.from('frames').remove([path]);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    const { error } = await supabase
      .from('elements')
      .delete()
      .eq('id', elementId);

    if (error) {
      alert('שגיאה במחיקת האלמנט');
    } else {
      setElements(prev => prev.filter(e => e.id !== elementId));
    }
  };

  const toggleElementStatus = async (elementId: string, isActive: boolean) => {
    const supabase = getSupabase();
    if (!supabase) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('elements')
      .update({ is_active: isActive })
      .eq('id', elementId);

    if (error) {
      alert('שגיאה בעדכון');
    } else {
      setElements(prev => prev.map(e => 
        e.id === elementId ? { ...e, is_active: isActive } : e
      ));
    }
  };

  // ==========================================
  // Filters
  // ==========================================

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredFrames = frames.filter(frame => {
    const matchesSearch = frame.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || frame.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'לא משויך';
  };

  // ==========================================
  // Tabs Config
  // ==========================================

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'סקירה כללית', icon: '📊' },
    { id: 'users', label: 'משתמשים', icon: '👥' },
    { id: 'frames', label: 'מסגרות', icon: '🖼️' },
    { id: 'categories', label: 'קטגוריות', icon: '📁' },
    { id: 'elements', label: 'אלמנטים', icon: '✨' },
    { id: 'orders', label: 'הזמנות', icon: '📦' },
  ];

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-2xl font-bold text-indigo-600">
              🖼️ Misgarot Online
            </Link>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              חזרה לדאשבורד
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm p-4 space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">טוען...</p>
              </div>
            ) : (
              <>
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && stats && (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-gray-800">סקירה כללית</h1>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <StatCard icon="👥" label="סה״כ משתמשים" value={stats.totalUsers} color="blue" />
                      <StatCard icon="📷" label="צלמים פעילים" value={stats.totalPhotographers} color="purple" />
                      <StatCard icon="💳" label="מנויים פעילים" value={stats.activeSubscriptions} color="green" />
                      <StatCard icon="🎨" label="עיצובים נוצרו" value={stats.totalDesigns} color="pink" />
                      <StatCard icon="🖼️" label="מסגרות" value={stats.totalFrames} color="yellow" />
                      <StatCard icon="📦" label="הזמנות" value={stats.totalOrders} color="orange" />
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-800 mb-4">פעולות מהירות</h2>
                      <div className="flex flex-wrap gap-4">
                        <Link 
                          to="/editor/landscape/new"
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors"
                        >
                          🎨 עצב מסגרת חדשה
                        </Link>
                        <button 
                          onClick={() => { handleTabChange('categories'); setShowNewCategory(true); }}
                          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          ➕ הוסף קטגוריה
                        </button>
                        <button 
                          onClick={() => handleTabChange('frames')}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          �️ נהל מסגרות
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h1 className="text-2xl font-bold text-gray-800">ניהול משתמשים</h1>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
                      <input
                        type="text"
                        placeholder="חיפוש לפי שם או אימייל..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      />
                      <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      >
                        <option value="all">כל התפקידים</option>
                        <option value="photographer">צלמים</option>
                        <option value="admin">מנהלים</option>
                      </select>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">משתמש</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">תפקיד</th>
                            <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">⭐</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">מנוי</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">עיצובים</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">לקוחות</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">סטטוס</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">פעולות</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {user.is_starred && (
                                    <span className="text-yellow-500" title="צלם מורשה">⭐</span>
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-800">{user.name || 'ללא שם'}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'admin' 
                                    ? 'bg-red-100 text-red-700' 
                                    : user.role === 'client'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {user.role === 'admin' ? 'מנהל' : user.role === 'client' ? 'לקוח' : 'צלם'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {user.role === 'photographer' && (
                                  <button
                                    onClick={() => toggleUserStar(user.id, !user.is_starred)}
                                    className={`p-2 rounded-full transition-all ${
                                      user.is_starred 
                                        ? 'bg-yellow-100 hover:bg-yellow-200' 
                                        : 'bg-gray-100 hover:bg-yellow-50'
                                    }`}
                                    title={user.is_starred ? 'הסר הרשאות מיוחדות' : 'הענק הרשאות מיוחדות'}
                                  >
                                    <span className={user.is_starred ? 'text-yellow-500' : 'text-gray-400'}>
                                      {user.is_starred ? '⭐' : '☆'}
                                    </span>
                                  </button>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.subscription_plan === 'pro' 
                                    ? 'bg-purple-100 text-purple-700'
                                    : user.subscription_plan === 'business'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {user.subscription_plan || 'free'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{user.designs_count || 0}</td>
                              <td className="px-6 py-4 text-gray-600">{user.clients_count || 0}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.is_active 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {user.is_active ? 'פעיל' : 'מושבת'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button className="text-indigo-600 hover:text-indigo-800 text-sm">
                                  עריכה
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {filteredUsers.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          לא נמצאו משתמשים
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Frames Tab */}
                {activeTab === 'frames' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h1 className="text-2xl font-bold text-gray-800">ניהול מסגרות</h1>
                      <Link
                        to="/editor/landscape/new"
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2"
                      >
                        <span>🎨</span>
                        <span>עצב מסגרת חדשה</span>
                      </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
                      <input
                        type="text"
                        placeholder="חיפוש מסגרת..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      />
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      >
                        <option value="all">כל הקטגוריות</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFrames.map(frame => (
                          <div key={frame.id} className="border rounded-xl overflow-hidden hover:shadow-lg transition-all group">
                            {/* Thumbnail */}
                            <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative">
                              {frame.thumbnail_url ? (
                                <img src={frame.thumbnail_url} alt={frame.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-4xl">🖼️</span>
                              )}
                              
                              {/* Status Badge */}
                              {!frame.is_active && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                  מושבת
                                </div>
                              )}
                              
                              {/* Hover Actions */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Link 
                                  to={`/editor/landscape/${frame.id}?source=supabase&frameId=${frame.id}&adminEdit=true`}
                                  className="px-3 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100"
                                >
                                  🎨 ערוך בעורך
                                </Link>
                                <button 
                                  onClick={() => setEditingFrame(frame)}
                                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                                >
                                  ✏️ פרטים
                                </button>
                              </div>
                            </div>
                            
                            {/* Info */}
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-medium text-gray-800">{frame.name}</h3>
                                  <p className="text-xs text-gray-500">{getCategoryName(frame.category_id)}</p>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {frame.orientation === 'landscape' ? '🖼️' : '📱'}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {frame.is_premium && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">💎</span>
                                  )}
                                  <span className="text-xs text-gray-500">{frame.usage_count} שימושים</span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => toggleFrameStatus(frame.id, !frame.is_active)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      frame.is_active 
                                        ? 'text-green-600 hover:bg-green-50' 
                                        : 'text-gray-400 hover:bg-gray-100'
                                    }`}
                                    title={frame.is_active ? 'השבת' : 'הפעל'}
                                  >
                                    {frame.is_active ? '✅' : '⭕'}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ type: 'frame', id: frame.id, name: frame.name })}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="מחק"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {filteredFrames.length === 0 && (
                        <div className="text-center py-12">
                          <span className="text-5xl mb-4 block">🖼️</span>
                          <p className="text-gray-500 mb-4">
                            {searchTerm || filterCategory !== 'all' ? 'לא נמצאו מסגרות' : 'אין מסגרות עדיין'}
                          </p>
                          <Link
                            to="/editor/landscape/new"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                          >
                            <span>🎨</span>
                            <span>עצב מסגרת ראשונה</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h1 className="text-2xl font-bold text-gray-800">ניהול קטגוריות</h1>
                      <button 
                        onClick={() => setShowNewCategory(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <span>➕</span>
                        <span>קטגוריה חדשה</span>
                      </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">אייקון</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">שם</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">שם באנגלית</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">מסגרות</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">סטטוס</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">פעולות</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {categories.map(cat => {
                            const frameCount = frames.filter(f => f.category_id === cat.id).length;
                            return (
                              <tr key={cat.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-2xl">{cat.icon || '📁'}</td>
                                <td className="px-6 py-4 font-medium text-gray-800">{cat.name}</td>
                                <td className="px-6 py-4 text-gray-600" dir="ltr">{cat.name_en}</td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                                    {frameCount} מסגרות
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    cat.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {cat.is_active ? '✅ פעיל' : '❌ מושבת'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => setEditingCategory(cat)}
                                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                                    >
                                      ✏️ עריכה
                                    </button>
                                    <button 
                                      onClick={() => setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })}
                                      className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                      🗑️ מחק
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      
                      {categories.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          אין קטגוריות עדיין
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Elements Tab */}
                {activeTab === 'elements' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h1 className="text-2xl font-bold text-gray-800">ניהול אלמנטים</h1>
                      <button 
                        onClick={() => setShowUploadElement(true)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                      >
                        <span>➕</span>
                        <span>העלה אלמנט</span>
                      </button>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">✨</span>
                        <div>
                          <h3 className="font-medium text-emerald-800 mb-2">מה זה אלמנטים?</h3>
                          <p className="text-sm text-emerald-700 mb-3">
                            אלמנטים הם גרפיקות שניתן להוסיף לעיצובים - לוגואים, סטיקרים, מסגרות דקורטיביות, אייקונים ועוד.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {elementCategories.slice(0, 6).map(cat => (
                              <span key={cat.id} className="px-3 py-1 bg-white/50 rounded-full text-sm">
                                {cat.icon} {cat.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filter by category */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedElementCategory('all')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          selectedElementCategory === 'all'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        הכל ({elements.length})
                      </button>
                      {elementCategories.map(cat => {
                        const count = elements.filter(e => e.category_id === cat.id).length;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedElementCategory(cat.id)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              selectedElementCategory === cat.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {cat.icon} {cat.name} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Elements Grid */}
                    {elements.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {elements
                          .filter(el => selectedElementCategory === 'all' || el.category_id === selectedElementCategory)
                          .map(element => (
                          <div 
                            key={element.id} 
                            className={`bg-white rounded-xl shadow-sm p-3 group relative ${
                              !element.is_active ? 'opacity-50' : ''
                            }`}
                          >
                            {/* Image */}
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                              <img 
                                src={element.thumbnail_url || element.image_url} 
                                alt={element.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            
                            {/* Name */}
                            <p className="text-sm font-medium text-gray-800 truncate">{element.name}</p>
                            
                            {/* Badges */}
                            <div className="flex items-center gap-1 mt-1">
                              {element.is_premium && (
                                <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">💎</span>
                              )}
                              <span className="text-xs text-gray-400">{element.usage_count} שימושים</span>
                            </div>

                            {/* Actions - show on hover */}
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={() => toggleElementStatus(element.id, !element.is_active)}
                                className={`p-1.5 rounded-lg ${
                                  element.is_active 
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                                title={element.is_active ? 'השבת' : 'הפעל'}
                              >
                                {element.is_active ? '⏸️' : '▶️'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'element', id: element.id, name: element.name })}
                                className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                title="מחק"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
                        <span className="text-5xl mb-4 block">🎨</span>
                        <p className="mb-2">אין אלמנטים עדיין</p>
                        <p className="text-sm mb-4">התחל להעלות סטיקרים, לוגואים ואלמנטים גרפיים</p>
                        <button
                          onClick={() => setShowUploadElement(true)}
                          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          ➕ העלה אלמנט ראשון
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Element Modal */}
                {showUploadElement && (
                  <UploadElementModal
                    categories={elementCategories}
                    onClose={() => setShowUploadElement(false)}
                    onUpload={uploadElement}
                    isLoading={uploadingElement}
                  />
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h1 className="text-2xl font-bold text-gray-800">ניהול הזמנות</h1>
                      <Link
                        to="/admin/orders"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                      >
                        <span>📦</span>
                        <span>פתח ניהול מלא</span>
                      </Link>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{stats?.totalOrders || 0}</div>
                        <div className="text-gray-600">סה"כ הזמנות</div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                        <div className="text-3xl font-bold text-yellow-600 mb-2">0</div>
                        <div className="text-yellow-700">בקשות לפרסום ממתינות</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                        <div className="text-3xl font-bold text-green-600 mb-2">0</div>
                        <div className="text-green-700">הזמנות שהושלמו החודש</div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                      <span className="text-6xl mb-4 block">📦</span>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">ניהול הזמנות מסגרות</h3>
                      <p className="text-gray-600 mb-4">צפה בכל ההזמנות, אשר בקשות לפרסום ונהל סטטוסים</p>
                      <Link
                        to="/admin/orders"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                      >
                        <span>🚀</span>
                        <span>עבור לניהול הזמנות</span>
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      {editingFrame && (
        <EditFrameModal
          frame={editingFrame}
          categories={categories}
          onClose={() => setEditingFrame(null)}
          onSave={(updates) => updateFrame(editingFrame.id, updates)}
        />
      )}

      {(editingCategory || showNewCategory) && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setEditingCategory(null); setShowNewCategory(false); }}
          onSave={(data) => saveCategory(data, editingCategory?.id)}
        />
      )}

      {deleteConfirm && (
        <DeleteModal
          title={
            deleteConfirm.type === 'frame' ? 'מחיקת מסגרת' : 
            deleteConfirm.type === 'element' ? 'מחיקת אלמנט' : 
            'מחיקת קטגוריה'
          }
          message={`האם אתה בטוח שברצונך למחוק את "${deleteConfirm.name}"? פעולה זו לא ניתנת לביטול.`}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            if (deleteConfirm.type === 'frame') {
              deleteFrame(deleteConfirm.id);
            } else if (deleteConfirm.type === 'element') {
              deleteElement(deleteConfirm.id);
            } else {
              deleteCategory(deleteConfirm.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default AdminPage;
