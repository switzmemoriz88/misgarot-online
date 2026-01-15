// ==========================================
// Category Selection Page - בחירת קטגוריה
// ==========================================
// עיצוב מודרני וחדשני עם אנימציות ואפקטים

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../contexts';
import { getSupabase } from '../lib/supabase/client';

// Type for category from Supabase
interface CategoryFromDB {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

// Default style for unknown categories
const defaultStyle = {
  emoji: '📁',
  gradient: 'from-gray-400 via-gray-500 to-gray-600',
  bgPattern: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)',
  hoverGlow: 'hover:shadow-gray-400/30'
};

// מיפוי אייקונים משופרים לכל קטגוריה
const categoryStyles: Record<string, { 
  emoji: string; 
  gradient: string; 
  bgPattern: string;
  hoverGlow: string;
}> = {
  'wedding': { 
    emoji: '❤️', 
    gradient: 'from-rose-400 via-pink-500 to-rose-600',
    bgPattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)',
    hoverGlow: 'hover:shadow-pink-500/30'
  },
  'bar-mitzvah': { 
    emoji: '✡️', 
    gradient: 'from-blue-400 via-indigo-500 to-blue-600',
    bgPattern: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)',
    hoverGlow: 'hover:shadow-indigo-500/30'
  },
  'bat-mitzvah': { 
    emoji: '🌸', 
    gradient: 'from-purple-400 via-fuchsia-500 to-purple-600',
    bgPattern: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)',
    hoverGlow: 'hover:shadow-purple-500/30'
  },
  'brit': { 
    emoji: '👶', 
    gradient: 'from-cyan-400 via-sky-500 to-blue-500',
    bgPattern: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.2) 0%, transparent 50%)',
    hoverGlow: 'hover:shadow-sky-500/30'
  },
  'birthday': { 
    emoji: '🎂', 
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    bgPattern: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)',
    hoverGlow: 'hover:shadow-orange-500/30'
  },
  'business': { 
    emoji: '💼', 
    gradient: 'from-slate-500 via-gray-600 to-slate-700',
    bgPattern: 'radial-gradient(circle at 50% 100%, rgba(255,255,255,0.1) 0%, transparent 50%)',
    hoverGlow: 'hover:shadow-slate-500/30'
  },
  'henna': { 
    emoji: '🪬', 
    gradient: 'from-amber-500 via-orange-600 to-red-600',
    bgPattern: 'radial-gradient(circle at 60% 40%, rgba(255,255,255,0.2) 0%, transparent 50%)',
    hoverGlow: 'hover:shadow-amber-500/30'
  },
  'engagement': { 
    emoji: '💍', 
    gradient: 'from-rose-300 via-pink-500 to-rose-600',
    bgPattern: 'radial-gradient(circle at 40% 60%, rgba(255,255,255,0.2) 0%, transparent 50%)',
    hoverGlow: 'hover:shadow-rose-500/30'
  },
  'sheva-brachot': { 
    emoji: '🍷', 
    gradient: 'from-violet-400 via-purple-500 to-indigo-600',
    bgPattern: 'radial-gradient(circle at 25% 75%, rgba(255,255,255,0.2) 0%, transparent 50%)',
    hoverGlow: 'hover:shadow-violet-500/30'
  },
  'other': { 
    emoji: '✨', 
    gradient: 'from-slate-400 via-gray-500 to-slate-600',
    bgPattern: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)',
    hoverGlow: 'hover:shadow-slate-400/30'
  },
};

const CategorySelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryFromDB[]>([]);
  const [loading, setLoading] = useState(true);

  // Load categories from Supabase
  useEffect(() => {
    const loadCategories = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await (supabase as any)
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, []);

  const handleSelectCategory = (categorySlug: string) => {
    navigate(`/frames/${categorySlug}`);
  };

  const getStyle = (slug: string, icon?: string | null) => {
    // Use predefined styles if available, otherwise generate from icon
    if (categoryStyles[slug]) {
      return categoryStyles[slug];
    }
    // Return style with the category's icon or default
    return {
      ...defaultStyle,
      emoji: icon || '📁'
    };
  };
  
  // Check auth state
  const { isAuthenticated } = useAuthContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50" dir="rtl">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/20 to-purple-100/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all group">
              <svg 
                className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">ראשי</span>
            </Link>
            
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            
            <Link to="/" className="hidden sm:flex items-center gap-3 group">
              <div className="w-10 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/30 transition-shadow">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Misgarot Online
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:block"
                >
                  דשבורד
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  התחברות
                </Link>
                <Link 
                  to="/login" 
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                >
                  הרשמה חינם
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Flow Progress */}
        <div className="flex items-center justify-center gap-3 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold ring-4 ring-indigo-100">1</div>
            <span className="text-sm text-indigo-600 font-medium hidden sm:inline">בחירת קטגוריה</span>
          </div>
          <div className="w-8 sm:w-12 h-1 rounded-full bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-sm text-gray-500 hidden sm:inline">בחירת מסגרת</span>
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
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-indigo-700 font-medium text-sm mb-6">
            <span className="animate-pulse">✨</span>
            <span>מעל 1,000 מסגרות מעוצבות</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            בחר את 
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> סוג האירוע</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            בחר קטגוריה ותגלה מגוון מסגרות מגנט מעוצבות במיוחד עבורך
          </p>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500">אין קטגוריות זמינות כרגע</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-16">
            {categories.map((category, index) => {
              const style = getStyle(category.slug, category.icon);
              const isHovered = hoveredId === category.slug;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleSelectCategory(category.slug)}
                  onMouseEnter={() => setHoveredId(category.slug)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group relative bg-white rounded-2xl shadow-md ${style.hoverGlow} hover:shadow-xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1`}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Gradient Background */}
                  <div 
                    className={`relative h-28 sm:h-32 bg-gradient-to-br ${style.gradient} flex items-center justify-center overflow-hidden`}
                    style={{ backgroundImage: style.bgPattern }}
                  >
                    {/* Floating particles */}
                    <div className="absolute inset-0">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse"
                          style={{
                            top: `${20 + i * 20}%`,
                            left: `${15 + i * 25}%`,
                            animationDelay: `${i * 0.3}s`,
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Main Emoji */}
                    <div className={`relative z-10 transition-all duration-500 ${isHovered ? 'scale-110 -rotate-3' : 'scale-100'}`}>
                      <span className="text-5xl sm:text-6xl filter drop-shadow-lg">
                        {style.emoji}
                      </span>
                    </div>
                    
                    {/* Shine effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`} />
                  </div>
                  
                  {/* Info */}
                  <div className="p-3 sm:p-4 text-center relative">
                    {/* Subtle top border accent */}
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r ${style.gradient} rounded-full opacity-50`} />
                    
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 group-hover:text-gray-900 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-500 text-xs hidden sm:block mb-2">
                      {category.description || ''}
                    </p>
                    
                    {/* CTA */}
                    <div className={`flex items-center justify-center gap-1 text-xs font-medium transition-all duration-300 ${isHovered ? 'text-indigo-600' : 'text-gray-400'}`}>
                      <span>לצפייה במסגרות</span>
                      <svg 
                        className={`w-3 h-3 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Custom Design CTA */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-xl opacity-20" />
          <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-60 h-60 border border-white/20 rounded-full translate-x-1/2 translate-y-1/2" />
            </div>
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-right">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  יש לך רעיון משלך? ✨
                </h3>
                <p className="text-gray-400 max-w-md">
                  צור עיצוב מותאם אישית מאפס עם העורך המתקדם שלנו
                </p>
              </div>
              
              <button
                onClick={() => navigate('/editor/landscape/new')}
                className="group flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-2xl font-bold transition-all hover:shadow-xl hover:shadow-white/20"
              >
                <span className="text-2xl group-hover:rotate-12 transition-transform">✏️</span>
                <span>התחל עיצוב מאפס</span>
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-3 gap-8">
          {[
            { number: '1,000+', label: 'מסגרות מעוצבות', emoji: '🖼️' },
            { number: '50+', label: 'צלמים פעילים', emoji: '📸' },
            { number: '10,000+', label: 'עיצובים נוצרו', emoji: '✨' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-2">{stat.emoji}</div>
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {stat.number}
              </div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CategorySelectionPage;
