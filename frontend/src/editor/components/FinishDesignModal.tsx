// ==========================================
// Finish Design Modal - מודל סיום עיצוב
// ==========================================
// מאפשר שליחה לעצמי (צלם) או ללקוח
// ==========================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface FinishDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToSelf: (email: string) => Promise<void>;
  onSendToClient: (clientEmail: string, clientName: string) => Promise<void>;
  landscapePreview: string;
  portraitPreview: string;
  isPhotographer?: boolean; // true = צלם, false = לקוח
}

type SendMode = 'self' | 'client';

export const FinishDesignModal: React.FC<FinishDesignModalProps> = ({
  isOpen,
  onClose,
  onSendToSelf,
  onSendToClient,
  landscapePreview,
  portraitPreview,
  isPhotographer = true,
}) => {
  const { t } = useTranslation();
  const [sendMode, setSendMode] = useState<SendMode>('self');
  const [email, setEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSend = async () => {
    setError('');
    setIsSending(true);

    try {
      if (sendMode === 'self') {
        if (!email) {
          setError('נא להזין כתובת מייל');
          setIsSending(false);
          return;
        }
        await onSendToSelf(email);
      } else {
        if (!clientEmail || !clientName) {
          setError('נא להזין שם וכתובת מייל של הלקוח');
          setIsSending(false);
          return;
        }
        await onSendToClient(clientEmail, clientName);
      }
      setSuccess(true);
    } catch (err) {
      console.error('Send error:', err);
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(`שגיאה בשליחה: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError('');
    setEmail('');
    setClientName('');
    setClientEmail('');
    setSendMode('self');
    onClose();
  };

  // Success Screen
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" dir="rtl">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {sendMode === 'self' ? '🎉 נשלח בהצלחה!' : '🎉 נשלח ללקוח!'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {sendMode === 'self' 
              ? `המסגרות נשלחו למייל ${email}`
              : `הלקוח ${clientName} יקבל את העיצוב למייל`
            }
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
            >
              סיים
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setSendMode(sendMode === 'self' ? 'client' : 'self');
              }}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
            >
              {sendMode === 'self' ? 'שלח גם ללקוח' : 'שלח גם לעצמי'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">סיום ושליחת העיצוב</h2>
                <p className="text-white/80 text-sm">העיצוב מוכן! בחר איך לשלוח אותו</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-3">תצוגה מקדימה של העיצובים</h3>
          <div className="flex gap-4 justify-center">
            {/* Landscape Preview */}
            <div className="text-center">
              <div className="w-40 h-30 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                {landscapePreview ? (
                  <img src={landscapePreview} alt="רוחב" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span>🖼️</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 mt-1 block">רוחב</span>
            </div>
            
            {/* Portrait Preview */}
            <div className="text-center">
              <div className="w-24 h-32 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                {portraitPreview ? (
                  <img src={portraitPreview} alt="אורך" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span>📱</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 mt-1 block">אורך</span>
            </div>
          </div>
        </div>

        {/* Send Options */}
        <div className="p-6">
          {/* Mode Selection */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSendMode('self')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                sendMode === 'self'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  sendMode === 'self' ? 'bg-indigo-500 text-white' : 'bg-gray-100'
                }`}>
                  <span className="text-xl">📧</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-800">שלח לעצמי</div>
                  <div className="text-xs text-gray-500">קבל את העיצובים למייל שלך</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setSendMode('client')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                sendMode === 'client'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  sendMode === 'client' ? 'bg-purple-500 text-white' : 'bg-gray-100'
                }`}>
                  <span className="text-xl">💑</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-800">שלח ללקוח</div>
                  <div className="text-xs text-gray-500">הזוג יקבל סקיצה למייל</div>
                </div>
              </div>
            </button>
          </div>

          {/* Form */}
          {sendMode === 'self' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כתובת המייל שלך
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  dir="ltr"
                />
              </div>
              
              <div className="bg-indigo-50 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="text-sm text-indigo-700">
                  <p className="font-medium">מה תקבל?</p>
                  <ul className="mt-1 space-y-1 text-indigo-600">
                    <li>• מסגרת רוחב בפורמט PNG</li>
                    <li>• מסגרת אורך בפורמט PNG</li>
                    <li>• העיצוב יישמר במערכת הניהול</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם הלקוח
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="דנה ויוסי"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כתובת המייל של הלקוח
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  dir="ltr"
                />
              </div>
              
              <div className="bg-purple-50 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl">💌</span>
                <div className="text-sm text-purple-700">
                  <p className="font-medium">מה הלקוח יקבל?</p>
                  <ul className="mt-1 space-y-1 text-purple-600">
                    <li>• סקיצה של מסגרת רוחב (PNG)</li>
                    <li>• סקיצה של מסגרת אורך (PNG)</li>
                    <li>• הודעה אישית ממך</li>
                  </ul>
                  <p className="mt-2 font-medium">מה אתה תקבל?</p>
                  <ul className="mt-1 space-y-1 text-purple-600">
                    <li>• התראה על עיצוב חדש שנשלח</li>
                    <li>• העיצוב יופיע במערכת הניהול</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-all"
            >
              ביטול
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className={`flex-1 px-6 py-3 bg-gradient-to-r ${
                sendMode === 'self'
                  ? 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  : 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              } text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
            >
              {isSending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  שולח...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>{sendMode === 'self' ? '📧' : '💌'}</span>
                  <span>{sendMode === 'self' ? 'שלח לעצמי' : 'שלח ללקוח'}</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinishDesignModal;
