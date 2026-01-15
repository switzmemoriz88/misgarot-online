// ==========================================
// PhotographerStarBadge - תג כוכב לצלמים
// ==========================================

import React from 'react';
import { Star, Shield, Sparkles } from 'lucide-react';

interface PhotographerStarBadgeProps {
  isStarred: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const PhotographerStarBadge: React.FC<PhotographerStarBadgeProps> = ({
  isStarred,
  size = 'md',
  showLabel = false,
  onClick,
  disabled = false
}) => {
  const sizes = {
    sm: {
      badge: 'w-6 h-6',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      badge: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      badge: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  };

  const s = sizes[size];

  if (onClick) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          group flex items-center gap-2 transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isStarred ? 'הסר הרשאות מיוחדות' : 'הענק הרשאות מיוחדות'}
      >
        <div className={`
          ${s.badge} rounded-full flex items-center justify-center transition-all
          ${isStarred 
            ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-200' 
            : 'bg-gray-100 hover:bg-yellow-50 border-2 border-dashed border-gray-300 hover:border-yellow-400'
          }
        `}>
          <Star className={`
            ${s.icon} transition-all
            ${isStarred 
              ? 'text-white fill-white' 
              : 'text-gray-400 group-hover:text-yellow-500'
            }
          `} />
        </div>
        {showLabel && (
          <span className={`
            ${s.text} font-medium transition-colors
            ${isStarred ? 'text-yellow-600' : 'text-gray-500 group-hover:text-yellow-600'}
          `}>
            {isStarred ? 'צלם מורשה' : 'הענק הרשאה'}
          </span>
        )}
      </button>
    );
  }

  if (!isStarred) return null;

  return (
    <div className="flex items-center gap-2">
      <div className={`
        ${s.badge} rounded-full flex items-center justify-center
        bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-200
      `}>
        <Star className={`${s.icon} text-white fill-white`} />
      </div>
      {showLabel && (
        <span className={`${s.text} font-medium text-yellow-600`}>
          צלם מורשה
        </span>
      )}
    </div>
  );
};

// ==========================================
// Starred Photographer Info Card
// ==========================================

export const StarredPhotographerCard: React.FC<{
  isStarred: boolean;
  onRequestStar?: () => void;
}> = ({ isStarred, onRequestStar }) => {
  if (isStarred) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-200/50">
            <Star className="w-6 h-6 text-white fill-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-yellow-800">צלם מורשה</h3>
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-sm text-yellow-700">
              יש לך הרשאות מיוחדות! אתה יכול לפרסם מסגרות ישירות למאגר הציבורי.
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-yellow-600">
              <Shield className="w-4 h-4" />
              <span>הרשאה זו ניתנה לך על ידי מנהל המערכת</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
          <Star className="w-6 h-6 text-gray-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-700 mb-1">רוצה לפרסם מסגרות?</h3>
          <p className="text-sm text-gray-600 mb-3">
            אם עיצבת מסגרת יפה, תוכל לבקש מהמנהלים לפרסם אותה במאגר הציבורי.
            צלמים מובילים יכולים לקבל הרשאה לפרסם ישירות.
          </p>
          <p className="text-xs text-gray-500">
            💡 כל בקשה נבדקת על ידי צוות האתר
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhotographerStarBadge;
