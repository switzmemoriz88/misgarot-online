// ==========================================
// Order Modal - מודאל הזמנה מהעורך
// ==========================================

import React, { useState } from 'react';
import { X, ShoppingCart, Check, Loader2, Share2, Star } from 'lucide-react';
import { createFrameOrder, sendOrderConfirmationEmail, publishFrameDirectly } from '../../lib/supabase';
import { useAuthContext } from '../../contexts';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  designId?: string;
  designData?: any;
  thumbnailUrl?: string;
  onOrderCreated?: (orderNumber: string) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  designId,
  designData,
  thumbnailUrl,
  onOrderCreated
}) => {
  const { user, profile, isStarred } = useAuthContext();
  const [notes, setNotes] = useState('');
  const [requestPublish, setRequestPublish] = useState(false);
  const [publishDirectly, setPublishDirectly] = useState(false); // For starred users
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitOrder = async () => {
    if (!user) {
      setError('יש להתחבר כדי לבצע הזמנה');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // If starred user wants to publish directly
      if (isStarred && publishDirectly && thumbnailUrl) {
        const publishResult = await publishFrameDirectly({
          name: `מסגרת ${new Date().toLocaleDateString('he-IL')}`,
          thumbnailUrl,
          designData,
          creatorName: profile?.name,
          creatorBusiness: profile?.business_name
        });

        if (publishResult.success) {
          setPublishSuccess(true);
          setOrderSuccess('פורסם!');
          return;
        } else {
          setError(publishResult.error || 'שגיאה בפרסום');
          return;
        }
      }

      // Regular order flow
      const result = await createFrameOrder({
        userId: user.id,
        designId,
        designData,
        thumbnailUrl,
        notes: notes.trim() || undefined,
        requestPublish
      });

      if (result.success && result.orderNumber) {
        setOrderSuccess(result.orderNumber);
        onOrderCreated?.(result.orderNumber);

        // Send confirmation email
        if (profile?.email) {
          await sendOrderConfirmationEmail({
            toEmail: profile.email,
            toName: profile.name || profile.email.split('@')[0],
            orderNumber: result.orderNumber,
            designThumbnail: thumbnailUrl,
            photographerName: profile.name || 'מסגרות',
            photographerBusiness: profile.business_name
          });
        }
      } else {
        setError(result.error || 'שגיאה ביצירת ההזמנה');
      }
    } catch (err) {
      console.error('Order error:', err);
      setError('שגיאה בלתי צפויה');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOrderSuccess(null);
    setPublishSuccess(false);
    setError(null);
    setNotes('');
    setRequestPublish(false);
    setPublishDirectly(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            הזמנת מסגרת
          </h2>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Success State */}
          {orderSuccess ? (
            <div className="text-center py-6">
              <div className={`w-16 h-16 ${publishSuccess ? 'bg-purple-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {publishSuccess ? (
                  <Star className="w-8 h-8 text-purple-600 fill-purple-600" />
                ) : (
                  <Check className="w-8 h-8 text-green-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {publishSuccess ? 'המסגרת פורסמה בהצלחה!' : 'ההזמנה נשלחה בהצלחה!'}
              </h3>
              {!publishSuccess && (
                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600 mb-1">מספר הזמנה:</p>
                  <p className="text-2xl font-mono font-bold text-blue-600">{orderSuccess}</p>
                </div>
              )}
              {publishSuccess && (
                <p className="text-sm text-purple-600 bg-purple-50 rounded-lg p-3 mb-4">
                  <Star className="w-4 h-4 inline ml-1 fill-purple-500" />
                  המסגרת זמינה כעת בגלריה הציבורית
                </p>
              )}
              {requestPublish && !publishSuccess && (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mb-4">
                  <Share2 className="w-4 h-4 inline ml-1" />
                  בקשת הפרסום נשלחה לאישור מנהל
                </p>
              )}
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                סגור
              </button>
            </div>
          ) : (
            <>
              {/* Preview */}
              {thumbnailUrl && (
                <div className="mb-4">
                  <img 
                    src={thumbnailUrl} 
                    alt="תצוגה מקדימה" 
                    className="w-full h-40 object-contain bg-gray-100 rounded-lg"
                  />
                </div>
              )}

              {/* Starred User: Direct Publish Option */}
              {isStarred && (
                <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-300">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publishDirectly}
                      onChange={(e) => {
                        setPublishDirectly(e.target.checked);
                        if (e.target.checked) setRequestPublish(false);
                      }}
                      className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500 mt-0.5"
                    />
                    <div>
                      <span className="font-medium text-amber-800 flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        פרסום ישיר לגלריה
                      </span>
                      <p className="text-xs text-amber-700 mt-1">
                        כצלם מכוכב, אתה יכול לפרסם ישירות לגלריה הציבורית ללא צורך באישור.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Notes - hide if publishing directly */}
              {!publishDirectly && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    הערות להזמנה (אופציונלי)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="הוסף הערות או בקשות מיוחדות..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Publish Request - only for non-starred or if not publishing directly */}
              {!publishDirectly && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requestPublish}
                      onChange={(e) => setRequestPublish(e.target.checked)}
                      className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 mt-0.5"
                    />
                    <div>
                      <span className="font-medium text-gray-800 flex items-center gap-1">
                        <Share2 className="w-4 h-4 text-purple-600" />
                        בקש פרסום לגלריה הציבורית
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        המסגרת תישלח לאישור מנהל. אם תאושר, תופיע בגלריה הציבורית למשך 6 חודשים.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2.5 ${publishDirectly ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {publishDirectly ? 'מפרסם...' : 'שולח...'}
                    </>
                  ) : publishDirectly ? (
                    <>
                      <Star className="w-4 h-4" />
                      פרסם לגלריה
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      שלח הזמנה
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
