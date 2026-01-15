// ==========================================
// 🖼️ Frame Upload Page - העלאת זוג מסגרות (רוחב + אורך)
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSupabase } from '@/lib/supabase/client';
import { useDropzone } from 'react-dropzone';

interface Category {
  id: string;
  name: string;
  name_en: string;
}

interface FrameFile {
  file: File | null;
  preview: string | null;
  width: number;
  height: number;
}

const FrameUploadPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form Data
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Frame Files - Landscape & Portrait
  const [landscapeFrame, setLandscapeFrame] = useState<FrameFile>({
    file: null, preview: null, width: 0, height: 0
  });
  const [portraitFrame, setPortraitFrame] = useState<FrameFile>({
    file: null, preview: null, width: 0, height: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    const categories = (data as Category[]) || [];
    setCategories(categories);
    if (categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  };

  // Dropzone for Landscape
  const onDropLandscape = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setLandscapeFrame({
          file,
          preview,
          width: img.width,
          height: img.height
        });
      };
      img.src = preview;
    }
  }, []);

  // Dropzone for Portrait
  const onDropPortrait = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setPortraitFrame({
          file,
          preview,
          width: img.width,
          height: img.height
        });
      };
      img.src = preview;
    }
  }, []);

  const landscapeDropzone = useDropzone({
    onDrop: onDropLandscape,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const portraitDropzone = useDropzone({
    onDrop: onDropPortrait,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  // Upload single frame
  const uploadFrame = async (
    supabase: NonNullable<ReturnType<typeof getSupabase>>,
    frame: FrameFile,
    orientation: 'landscape' | 'portrait',
    pairedFrameId?: string
  ): Promise<string | null> => {
    if (!frame.file) return null;

    const fileName = `${Date.now()}-${orientation}-${frame.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `frames/${categoryId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('frames')
      .upload(filePath, frame.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`שגיאה בהעלאת קובץ ${orientation}: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('frames')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Insert frame record
    const frameRecord = {
      name: name,
      name_en: nameEn || name,
      category_id: categoryId,
      is_premium: isPremium,
      is_active: isActive,
      thumbnail_url: publicUrl,
      full_url: publicUrl,
      preview_url: publicUrl,
      width: frame.width,
      height: frame.height,
      orientation: orientation,
      paired_frame_id: pairedFrameId || null,
      usage_count: 0,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedFrame, error: insertError } = await (supabase as any)
      .from('frames')
      .insert(frameRecord)
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`שגיאה בשמירת מסגרת ${orientation}: ${insertError.message}`);
    }

    return insertedFrame?.id || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!name.trim()) {
      setError('נא להזין שם למסגרת');
      return;
    }
    if (!categoryId) {
      setError('נא לבחור קטגוריה');
      return;
    }
    if (!landscapeFrame.file && !portraitFrame.file) {
      setError('נא להעלות לפחות מסגרת אחת (רוחב או אורך)');
      return;
    }

    setIsLoading(true);
    setUploadProgress(10);

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase not initialized');

      let landscapeId: string | null = null;
      let portraitId: string | null = null;

      // Upload landscape first (if exists)
      if (landscapeFrame.file) {
        setUploadProgress(30);
        landscapeId = await uploadFrame(supabase, landscapeFrame, 'landscape');
      }

      // Upload portrait (if exists) and link to landscape
      if (portraitFrame.file) {
        setUploadProgress(60);
        portraitId = await uploadFrame(supabase, portraitFrame, 'portrait', landscapeId || undefined);
      }

      // Update landscape with portrait ID (if both exist)
      if (landscapeId && portraitId) {
        setUploadProgress(80);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('frames')
          .update({ paired_frame_id: portraitId })
          .eq('id', landscapeId);
      }

      setUploadProgress(100);
      setSuccess('המסגרות הועלו בהצלחה!');

      // Redirect after success
      setTimeout(() => {
        navigate('/admin?tab=frames');
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בהעלאת המסגרות');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFrame = (type: 'landscape' | 'portrait') => {
    if (type === 'landscape') {
      if (landscapeFrame.preview) URL.revokeObjectURL(landscapeFrame.preview);
      setLandscapeFrame({ file: null, preview: null, width: 0, height: 0 });
    } else {
      if (portraitFrame.preview) URL.revokeObjectURL(portraitFrame.preview);
      setPortraitFrame({ file: null, preview: null, width: 0, height: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin?tab=frames" className="text-gray-500 hover:text-gray-700">
              ← חזרה לניהול מסגרות
            </Link>
            <h1 className="text-xl font-bold text-gray-800">🖼️ העלאת זוג מסגרות חדש</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Error / Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              ❌ {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              ✅ {success}
            </div>
          )}

          {/* Frame Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">📝 פרטי המסגרת</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם המסגרת (עברית) *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="לדוגמא: מסגרת זהב קלאסית"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם המסגרת (אנגלית)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Classic Gold Frame"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">בחר קטגוריה</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPremium}
                    onChange={(e) => setIsPremium(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">💎 פרימיום</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">✅ פעיל</span>
                </label>
              </div>
            </div>
          </div>

          {/* Frame Uploads - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Landscape Frame */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                🖼️ מסגרת רוחב (Landscape)
              </h2>
              <p className="text-sm text-gray-500 mb-4">מומלץ: 2500×1875 פיקסלים</p>
              
              <div
                {...landscapeDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  landscapeDropzone.isDragActive
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-400'
                }`}
              >
                <input {...landscapeDropzone.getInputProps()} />
                
                {landscapeFrame.preview ? (
                  <div className="space-y-3">
                    <img
                      src={landscapeFrame.preview}
                      alt="Landscape Preview"
                      className="max-h-40 mx-auto rounded-lg shadow"
                    />
                    <p className="text-xs text-gray-500">
                      {landscapeFrame.width} × {landscapeFrame.height} px
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFrame('landscape'); }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️ הסר
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="text-3xl">📤</div>
                    <p className="text-gray-600 text-sm">גרור קובץ או לחץ לבחירה</p>
                  </div>
                )}
              </div>
            </div>

            {/* Portrait Frame */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                🖼️ מסגרת אורך (Portrait)
              </h2>
              <p className="text-sm text-gray-500 mb-4">מומלץ: 1875×2500 פיקסלים</p>
              
              <div
                {...portraitDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  portraitDropzone.isDragActive
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-400'
                }`}
              >
                <input {...portraitDropzone.getInputProps()} />
                
                {portraitFrame.preview ? (
                  <div className="space-y-3">
                    <img
                      src={portraitFrame.preview}
                      alt="Portrait Preview"
                      className="max-h-40 mx-auto rounded-lg shadow"
                    />
                    <p className="text-xs text-gray-500">
                      {portraitFrame.width} × {portraitFrame.height} px
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFrame('portrait'); }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️ הסר
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="text-3xl">📤</div>
                    <p className="text-gray-600 text-sm">גרור קובץ או לחץ לבחירה</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-medium text-blue-800 mb-2">💡 טיפים להעלאה</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• ניתן להעלות מסגרת אחת או שתיים (רוחב ואורך)</li>
              <li>• אם מעלים שתיים - הן יקושרו אוטומטית כזוג</li>
              <li>• פורמטים נתמכים: PNG, JPG, WEBP (עד 10MB)</li>
              <li>• מומלץ להשתמש בתמונות עם רקע שקוף (PNG)</li>
            </ul>
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">מעלה...</span>
                <span className="text-sm font-medium text-indigo-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading || (!landscapeFrame.file && !portraitFrame.file)}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  🚀 העלה ופרסם
                </>
              )}
            </button>
            <Link
              to="/admin?tab=frames"
              className="py-3 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
            >
              ביטול
            </Link>
          </div>

        </form>
      </main>
    </div>
  );
};

export default FrameUploadPage;
