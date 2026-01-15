// ==========================================
// Frames Gallery Page - גלריית מסגרות לפי קטגוריה
// ==========================================
// טוען מסגרות מ-Supabase וגם מהנתונים הלוקאליים
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getCategoryById, getFramesByCategory } from '../data';
import { getSupabase } from '@/lib/supabase/client';
import { useAuthContext } from '../contexts';

// טיפוס למסגרת מ-Supabase
interface SupabaseFrame {
  id: string;
  name: string;
  name_en?: string;
  category_id: string;
  thumbnail_url?: string;
  preview_url?: string;
  is_premium: boolean;
  is_active: boolean;
  orientation: 'landscape' | 'portrait';
  paired_frame_id?: string;
  design_data?: Record<string, unknown>;
  width?: number;
  height?: number;
  created_at?: string;
}

// טיפוס מאוחד למסגרת בתצוגה
interface DisplayFrame {
  id: string;
  name: string;
  colors: string[];
  thumbnail?: string;
  isPremium: boolean;
  isFromSupabase: boolean;
  orientation: 'landscape' | 'portrait';
  hasDesignData: boolean;
  pairedFrameId?: string;
}

const FramesGalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [hoveredFrame, setHoveredFrame] = useState<string | null>(null);
  const [supabaseFrames, setSupabaseFrames] = useState<DisplayFrame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // קבלת מידע על הקטגוריה והמסגרות הלוקאליות
  const category = getCategoryById(categoryId || '');
  const localFrames = getFramesByCategory(categoryId || '');

  // טעינת מסגרות מ-Supabase
  useEffect(() => {
    const loadSupabaseFrames = async () => {
      const supabase = getSupabase();
      if (!supabase || !categoryId) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 Loading frames for category:', categoryId);
        
        // Get category by various methods: slug, name_en (like Wedding), or ILIKE match
        // Try multiple formats: "wedding", "Wedding", "wedding" as slug
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let { data: categoryData } = await (supabase as any)
          .from('categories')
          .select('id, name, name_en, slug')
          .or(`slug.eq.${categoryId},name_en.ilike.${categoryId.replace(/-/g, '%')}`)
          .limit(1)
          .single();
        
        // If not found, try converting category format (wedding -> Wedding)
        if (!categoryData) {
          const formattedName = categoryId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          console.log('🔍 Trying formatted name:', formattedName);
          
          const { data: catData2 } = await (supabase as any)
            .from('categories')
            .select('id, name, name_en, slug')
            .eq('name_en', formattedName)
            .single();
          categoryData = catData2;
        }
        
        const categoryUuid = categoryData?.id;
        const categoryName = categoryData?.name || category?.name;
        
        console.log('📁 Found category:', categoryName, 'UUID:', categoryUuid, 'name_en:', categoryData?.name_en, 'slug:', categoryData?.slug);
        
        if (!categoryUuid) {
          console.warn('⚠️ Category UUID not found for slug:', categoryId);
          // Try loading ALL frames and filter by category name in Hebrew
          console.log('🔄 Attempting fallback: loading all frames...');
        }
        
        // Load from FRAMES table (admin uploaded frames)
        // Filter by category_id directly in DB query for better performance
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let framesQuery = (supabase as any)
          .from('frames')
          .select('*, categories(id, name, name_en, slug)')
          .eq('is_active', true)
          .eq('orientation', 'landscape')
          .order('created_at', { ascending: false });
        
        // Only filter by category_id if we found it
        if (categoryUuid) {
          framesQuery = framesQuery.eq('category_id', categoryUuid);
        }
        
        const { data: framesData, error: framesError } = await framesQuery;

        // Load from PUBLIC_FRAMES table (published from orders)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let publicQuery = (supabase as any)
          .from('public_frames')
          .select('*, categories(id, name, slug)')
          .eq('is_active', true)
          .order('published_at', { ascending: false });
        
        if (categoryUuid) {
          publicQuery = publicQuery.eq('category_id', categoryUuid);
        }
        
        const { data: publicFramesData, error: publicError } = await publicQuery;

        if (framesError) {
          console.error('Error loading frames:', framesError);
        }
        if (publicError) {
          console.error('Error loading public frames:', publicError);
        }
        
        console.log('📦 Frames from frames table (category ' + categoryName + '):', framesData?.length || 0);
        console.log('📦 Frames from public_frames table (category ' + categoryName + '):', publicFramesData?.length || 0);
        
        const allDbFrames: DisplayFrame[] = [];
        
        // Process frames table data - already filtered by category_id in DB query
        if (framesData && framesData.length > 0) {
          framesData.forEach((frame: SupabaseFrame) => {
            allDbFrames.push({
              id: frame.id,
              name: frame.name,
              colors: extractColorsFromDesign(frame.design_data) || ['#6366f1', '#a855f7', '#ec4899'],
              thumbnail: frame.thumbnail_url || frame.preview_url,
              isPremium: frame.is_premium,
              isFromSupabase: true,
              orientation: frame.orientation || 'landscape',
              hasDesignData: !!frame.design_data,
              pairedFrameId: frame.paired_frame_id,
            });
          });
        }
        
        // Process public_frames table data - already filtered by category_id in DB query
        if (publicFramesData && publicFramesData.length > 0) {
          publicFramesData.forEach((frame: any) => {
            allDbFrames.push({
              id: frame.id,
              name: frame.name,
              colors: extractColorsFromDesign(frame.design_data) || ['#6366f1', '#a855f7', '#ec4899'],
              thumbnail: frame.thumbnail_url,
              isPremium: false,
              isFromSupabase: true,
              orientation: 'landscape',
              hasDesignData: !!frame.design_data,
            });
          });
        }
        
        console.log(`📋 Total frames matching category "${categoryId}":`, allDbFrames.length);
        setSupabaseFrames(allDbFrames);
      } catch (err) {
        console.error('Failed to load frames:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSupabaseFrames();
  }, [categoryId, category?.name]);

  // חילוץ צבעים מהעיצוב
  const extractColorsFromDesign = (designData?: Record<string, unknown>): string[] | null => {
    if (!designData) return null;
    
    // אם יש gradientColors
    if (designData.gradientColors && Array.isArray(designData.gradientColors)) {
      return designData.gradientColors as string[];
    }
    
    // אם יש backgroundColor
    if (designData.backgroundColor) {
      const bg = designData.backgroundColor as string;
      return [bg, bg, bg];
    }
    
    return null;
  };

  // המרת מסגרות לוקאליות לפורמט מאוחד
  const localDisplayFrames: DisplayFrame[] = localFrames.map(frame => ({
    id: frame.id,
    name: frame.name,
    colors: frame.colors,
    isPremium: false,
    isFromSupabase: false,
    orientation: 'landscape',
    hasDesignData: false,
  }));

  // מיזוג - מסגרות Supabase קודם
  const allFrames = [...supabaseFrames, ...localDisplayFrames];

  // אם אין קטגוריה - חזרה לדף הקטגוריות
  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">קטגוריה לא נמצאה</p>
          <button
            onClick={() => navigate('/categories')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
          >
            חזור לקטגוריות
          </button>
        </div>
      </div>
    );
  }

  const handleSelectFrame = (frame: DisplayFrame) => {
    if (frame.isFromSupabase && frame.hasDesignData) {
      // מסגרת מ-Supabase עם design_data - תמיד מתחילים ב-landscape
      // העורך יטען גם את גרסת ה-portrait אוטומטית
      navigate(`/editor/landscape?frameId=${frame.id}&source=supabase`);
    } else {
      // מסגרת לוקאלית
      navigate(`/editor/landscape/${frame.id}`);
    }
  };

  // Auth state
  const { isAuthenticated } = useAuthContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30" dir="rtl">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/categories')}
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
                <span className="font-medium">חזרה</span>
              </button>
              
              {/* Breadcrumb */}
              <nav className="hidden sm:flex items-center gap-2 text-sm">
                <button onClick={() => navigate('/')} className="text-gray-400 hover:text-indigo-600 transition-colors">
                  🏠
                </button>
                <span className="text-gray-300">/</span>
                <button onClick={() => navigate('/categories')} className="text-gray-500 hover:text-indigo-600 transition-colors">
                  קטגוריות
                </button>
                <span className="text-gray-300">/</span>
                <span className="text-indigo-600 font-medium">{category.name}</span>
              </nav>
            </div>

            {/* Category Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <h1 className="text-lg font-bold text-gray-800">{category.name}</h1>
                  <p className="text-xs text-gray-500">
                    {isLoading ? 'טוען...' : `${allFrames.length} מסגרות`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl shadow-sm">
                  {category.icon}
                </div>
              </div>
              
              {/* Login Link for non-authenticated users */}
              {!isAuthenticated && (
                <Link 
                  to="/login" 
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all text-sm"
                >
                  התחברות
                </Link>
              )}
            </div>
          </div>
          
          {/* Flow Progress */}
          <div className="flex items-center justify-center gap-3 mt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">✓</div>
              <span className="text-sm text-gray-600 hidden sm:inline">קטגוריה</span>
            </div>
            <div className="w-8 sm:w-12 h-1 rounded-full bg-green-500"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold ring-4 ring-indigo-100">2</div>
              <span className="text-sm text-indigo-600 font-medium hidden sm:inline">בחירת מסגרת</span>
            </div>
            <div className="w-8 sm:w-12 h-1 rounded-full bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
              <span className="text-sm text-gray-500 hidden sm:inline">עריכה</span>
            </div>
            <div className="w-8 sm:w-12 h-1 rounded-full bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">4</div>
              <span className="text-sm text-gray-500 hidden sm:inline">ייצוא</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            בחר מסגרת
          </h2>
          <p className="text-gray-600">
            לחץ על המסגרת לעריכה
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Frames Grid */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {allFrames.map((frame) => (
              <button
                key={frame.id}
                onClick={() => handleSelectFrame(frame)}
                onMouseEnter={() => setHoveredFrame(frame.id)}
                onMouseLeave={() => setHoveredFrame(null)}
                className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Premium Badge */}
                {frame.isPremium && (
                  <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <span>💎</span>
                    <span>פרימיום</span>
                  </div>
                )}

                {/* Dual Mode Badge - הודעה שכולל רוחב + אורך */}
                {frame.isFromSupabase && (
                  <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <span>📐</span>
                    <span>רוחב+אורך</span>
                  </div>
                )}

                {/* Frame Preview */}
                <div className="relative aspect-[4/3]">
                  {frame.thumbnail ? (
                    <img 
                      src={frame.thumbnail} 
                      alt={frame.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full"
                      style={{
                        background: `linear-gradient(135deg, ${frame.colors[0]} 0%, ${frame.colors[1] || frame.colors[0]} 50%, ${frame.colors[2] || frame.colors[0]} 100%)`,
                      }}
                    >
                      {/* Inner Frame */}
                      <div className="absolute inset-4 border-2 border-white/40 rounded-lg flex items-center justify-center">
                        <span className="text-white/60 text-4xl">📷</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Hover Overlay with dual-mode indicator */}
                  <div className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity ${
                    hoveredFrame === frame.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <span className="bg-white text-gray-800 px-5 py-2 rounded-lg font-medium flex items-center gap-2 mb-3">
                      <span>✏️</span>
                      <span>ערוך</span>
                    </span>
                    {frame.isFromSupabase && (
                      <div className="flex items-center gap-2 text-white/90 text-xs">
                        <span className="px-2 py-1 bg-white/20 rounded">🖼️ רוחב</span>
                        <span>+</span>
                        <span className="px-2 py-1 bg-white/20 rounded">📱 אורך</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Frame Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-lg">{frame.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {frame.colors.slice(0, 3).map((color, index) => (
                      <div
                        key={index}
                        className="w-5 h-5 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allFrames.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              אין מסגרות זמינות
            </h3>
            <button
              onClick={() => navigate('/editor')}
              className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
            >
              צור עיצוב חדש
            </button>
          </div>
        )}

        {/* Custom Design Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/editor/landscape/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-colors"
          >
            <span>✨</span>
            <span>צור עיצוב מותאם אישית</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default FramesGalleryPage;
