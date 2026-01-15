// ==========================================
// 👤 User Menu - תפריט משתמש עם שם והתנתקות
// ==========================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

const UserMenu = () => {
  const navigate = useNavigate();
  const { profile, logout, isAdmin } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsOpen(false);
  };

  // Show basic menu even if profile is loading
  if (!profile) {
    return (
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          👤
        </div>
        <span className="text-sm hidden sm:inline">פרופיל</span>
      </button>
    );
  }

  // Determine display name and badge based on role
  const getDisplayInfo = () => {
    switch (profile.role) {
      case 'admin':
        return {
          name: profile.business_name || profile.name || 'מנהל',
          badge: '🛡️ מנהל מערכת',
          badgeColor: 'bg-red-100 text-red-700',
          icon: '👑',
        };
      case 'photographer':
        return {
          name: profile.business_name || profile.name || 'צלם',
          badge: '📷 צלם',
          badgeColor: 'bg-purple-100 text-purple-700',
          icon: '📷',
        };
      case 'client':
        return {
          name: profile.name || 'לקוח',
          badge: profile.business_name ? `📷 ${profile.business_name}` : '👤 לקוח',
          badgeColor: 'bg-blue-100 text-blue-700',
          icon: '👤',
        };
      default:
        return {
          name: profile.name || profile.email,
          badge: '',
          badgeColor: '',
          icon: '👤',
        };
    }
  };

  const displayInfo = getDisplayInfo();

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
          profile.role === 'admin' 
            ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white' 
            : profile.role === 'photographer'
            ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
            : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
        }`}>
          {displayInfo.icon}
        </div>
        
        {/* Name & Role */}
        <div className="text-right hidden sm:block">
          <div className="font-medium text-gray-800 text-sm leading-tight">
            {displayInfo.name}
          </div>
          {displayInfo.badge && (
            <div className={`text-xs px-1.5 py-0.5 rounded-full inline-block ${displayInfo.badgeColor}`}>
              {displayInfo.badge}
            </div>
          )}
        </div>

        {/* Dropdown Arrow */}
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-medium text-gray-800">{displayInfo.name}</div>
            <div className="text-sm text-gray-500 truncate" dir="ltr">{profile.email}</div>
            {profile.role === 'client' && profile.business_name && (
              <div className="text-xs text-indigo-600 mt-1">
                📷 שייך ל: {profile.business_name}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Dashboard Link - For photographers and admins */}
            {(profile.role === 'photographer' || profile.role === 'admin') && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
              >
                <span>📊</span>
                <span>לוח בקרה</span>
              </button>
            )}

            {/* Profile Settings - For photographers and admins */}
            {(profile.role === 'photographer' || profile.role === 'admin') && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { navigate('/profile'); setIsOpen(false); }}
                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
              >
                <span>⚙️</span>
                <span>הגדרות פרופיל</span>
              </button>
            )}

            {/* Admin Panel - Only for admins */}
            {isAdmin && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { navigate('/admin'); setIsOpen(false); }}
                className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
              >
                <span>🛡️</span>
                <span>פאנל ניהול</span>
              </button>
            )}

            {/* My Designs - For clients */}
            {profile.role === 'client' && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { navigate('/categories'); setIsOpen(false); }}
                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
              >
                <span>🎨</span>
                <span>העיצובים שלי</span>
              </button>
            )}

            {/* Divider */}
            <div className="my-1 border-t border-gray-100"></div>

            {/* Logout Button */}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={handleLogout}
              className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
            >
              <span>🚪</span>
              <span>התנתק</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
