// ==========================================
// Export Modal - שליחת עיצוב במייל
// ==========================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEditorStore } from '../store';
import { CANVAS_EXPORT_SIZES } from '@/config/app.config';
import { SUPABASE_CONFIG } from '@/lib/supabase/config';
import { getSupabase } from '@/lib/supabase/client';

// Only PNG format
export type ExportFormat = 'png';
export type ExportQuality = 'high' | 'print';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageRef: React.RefObject<any>;
  landscapeStageRef?: React.RefObject<any>; // Reference to landscape design
  portraitStageRef?: React.RefObject<any>;  // Reference to portrait design
}

const QUALITY_SETTINGS: Record<ExportQuality, { pixelRatio: number; label: string; description: string }> = {
  high: { pixelRatio: 3, label: 'גבוהה', description: 'מתאים להדפסה ביתית' },
  print: { pixelRatio: 4, label: 'הדפסה מקצועית', description: 'איכות הדפסה מקסימלית (300 DPI)' },
};

export const ExportModal: React.FC<ExportModalProps> = ({ 
  isOpen, 
  onClose, 
  stageRef,
  landscapeStageRef,
  portraitStageRef,
}) => {
  const [quality, setQuality] = useState<ExportQuality>('print');
  const [isSending, setIsSending] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [photographerEmail, setPhotographerEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  const { canvasWidth, canvasHeight } = useEditorStore();

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setIsAuthenticated(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  // Generate PNG from stage
  const generatePNG = async (stage: any, pixelRatio: number): Promise<string> => {
    if (!stage) throw new Error('Stage not found');
    
    return stage.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
      backgroundColor: '#ffffff',
    });
  };

  // Handle send via email
  const handleSendEmail = async () => {
    // Validate emails
    if (!clientEmail || !photographerEmail) {
      setErrorMessage('נא למלא את כל כתובות המייל');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail) || !emailRegex.test(photographerEmail)) {
      setErrorMessage('כתובת מייל לא תקינה');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const pixelRatio = QUALITY_SETTINGS[quality].pixelRatio;
      const designs: { orientation: string; dataUrl: string }[] = [];

      // Generate landscape design
      if (landscapeStageRef?.current) {
        const landscapeData = await generatePNG(landscapeStageRef.current, pixelRatio);
        designs.push({ orientation: 'landscape', dataUrl: landscapeData });
      } else if (stageRef.current && canvasWidth > canvasHeight) {
        const landscapeData = await generatePNG(stageRef.current, pixelRatio);
        designs.push({ orientation: 'landscape', dataUrl: landscapeData });
      }

      // Generate portrait design
      if (portraitStageRef?.current) {
        const portraitData = await generatePNG(portraitStageRef.current, pixelRatio);
        designs.push({ orientation: 'portrait', dataUrl: portraitData });
      } else if (stageRef.current && canvasHeight > canvasWidth) {
        const portraitData = await generatePNG(stageRef.current, pixelRatio);
        designs.push({ orientation: 'portrait', dataUrl: portraitData });
      }

      // If only current stage is available
      if (designs.length === 0 && stageRef.current) {
        const currentData = await generatePNG(stageRef.current, pixelRatio);
        const orientation = canvasWidth > canvasHeight ? 'landscape' : 'portrait';
        designs.push({ orientation, dataUrl: currentData });
      }

      if (designs.length === 0) {
        throw new Error('לא נמצאו עיצובים לשליחה');
      }

      // Upload designs to Supabase Storage and get public URLs
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('שירות אחסון לא זמין');
      }

      const uploadedUrls: { landscapeUrl?: string; portraitUrl?: string } = {};

      for (const design of designs) {
        // Convert base64 to blob
        const response = await fetch(design.dataUrl);
        const blob = await response.blob();
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${design.orientation}.png`;
        
        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from('exports')
          .upload(`designs/${filename}`, blob, {
            contentType: 'image/png',
            upsert: true,
          });

        if (error) {
          console.error('Upload error:', error);
          throw new Error('שגיאה בהעלאת הקובץ');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('exports')
          .getPublicUrl(`designs/${filename}`);

        if (design.orientation === 'landscape') {
          uploadedUrls.landscapeUrl = urlData.publicUrl;
        } else {
          uploadedUrls.portraitUrl = urlData.publicUrl;
        }
      }

      // Call Edge Function to send emails
      const { data: sendData, error: sendError } = await supabase.functions.invoke(
        SUPABASE_CONFIG.functions.sendEmail,
        {
          body: {
            clientEmail,
            photographerEmail,
            clientName: clientName || 'לקוח יקר',
            landscapeUrl: uploadedUrls.landscapeUrl || '',
            portraitUrl: uploadedUrls.portraitUrl || '',
            designName: `עיצוב ${new Date().toLocaleDateString('he-IL')}`,
          },
        }
      );

      if (sendError) {
        console.error('Send error:', sendError);
        throw new Error('שגיאה בשליחת המייל');
      }

      if (!sendData?.success) {
        throw new Error(sendData?.message || 'שגיאה בשליחת המייל');
      }

      setSendSuccess(true);
      
      // Close after 3 seconds
      setTimeout(() => {
        onClose();
        setSendSuccess(false);
        setClientEmail('');
        setPhotographerEmail('');
        setClientName('');
      }, 3000);

    } catch (error) {
      console.error('Send failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'שגיאה בשליחה');
    } finally {
      setIsSending(false);
    }
  };

  // Calculate output size
  const outputWidth = Math.round(CANVAS_EXPORT_SIZES.landscape.width * QUALITY_SETTINGS[quality].pixelRatio);
  const outputHeight = Math.round(CANVAS_EXPORT_SIZES.landscape.height * QUALITY_SETTINGS[quality].pixelRatio);

  if (!isOpen) return null;

  // Not authenticated - show signup prompt
  if (isAuthenticated === false) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-[450px] p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">רוצה לשמור ולשלוח? 🎨</h2>
          <p className="text-gray-600 mb-6">
            הירשם עכשיו כדי לשמור את העיצובים שלך ולשלוח ללקוחות
          </p>
          
          <div className="space-y-3">
            <Link 
              to="/login"
              className="block w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              הרשמה - 14 יום חינם →
            </Link>
            <button
              onClick={onClose}
              className="block w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
            >
              המשך לעצב (בלי לשמור)
            </button>
          </div>
          
          <p className="text-gray-400 text-sm mt-4">
            ✓ ללא כרטיס אשראי &nbsp;•&nbsp; ✓ ביטול בכל עת
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">טוען...</p>
        </div>
      </div>
    );
  }

  // Success screen
  if (sendSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-[450px] p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">נשלח בהצלחה! 🎉</h2>
          <p className="text-gray-600 mb-2">
            העיצובים נשלחו ל:
          </p>
          <div className="space-y-1 text-sm text-gray-500">
            <p>📧 לקוח: {clientEmail}</p>
            <p>📧 צלם: {photographerEmail}</p>
          </div>
          <p className="text-gray-400 text-sm mt-4">
            החלון ייסגר אוטומטית...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">שליחת העיצובים 📧</h2>
            <p className="text-sm text-gray-500">העיצובים יישלחו ישירות למייל</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          )}

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם הלקוח</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="שם מלא"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Client Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מייל הלקוח *</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              required
            />
            <p className="text-xs text-gray-400 mt-1">הלקוח יקבל את 2 העיצובים (רוחב + אורך)</p>
          </div>

          {/* Photographer Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מייל הצלם *</label>
            <input
              type="email"
              value={photographerEmail}
              onChange={(e) => setPhotographerEmail(e.target.value)}
              placeholder="photographer@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              required
            />
            <p className="text-xs text-gray-400 mt-1">הצלם יקבל עותק של העיצובים</p>
          </div>

          {/* Quality Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">איכות הדפסה</label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(QUALITY_SETTINGS) as [ExportQuality, typeof QUALITY_SETTINGS[ExportQuality]][]).map(([q, settings]) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-right
                    ${quality === q 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <div className="font-medium text-gray-800">{settings.label}</div>
                  <div className="text-xs text-gray-500">{settings.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Output Info */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🖼️</span>
                <span>פורמט: <strong>PNG</strong> (איכות מקסימלית)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📐</span>
                <span>רזולוציה: <strong>{outputWidth} × {outputHeight}px</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📁</span>
                <span>יישלחו <strong>2 קבצים</strong>: מסגרת רוחב + מסגרת אורך</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
          >
            ביטול
          </button>
          <button
            onClick={handleSendEmail}
            disabled={isSending || !clientEmail || !photographerEmail}
            className={`
              px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium
              transition-all flex items-center gap-2 shadow-lg
              ${isSending || !clientEmail || !photographerEmail
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl'}
            `}
          >
            {isSending ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>שולח...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>שלח במייל</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
