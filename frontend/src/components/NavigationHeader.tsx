// ==========================================
// Navigation Header - כותרת ניווט משותפת
// ==========================================
// מספקת ניווט עקבי וברור בכל האפליקציה
// ==========================================

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface Breadcrumb {
  label: string;
  path?: string;
}

interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backPath?: string;
  backLabel?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  transparent?: boolean;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  backPath,
  backLabel = 'חזרה',
  breadcrumbs,
  actions,
  transparent = false,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-40 ${
        transparent 
          ? 'bg-transparent' 
          : 'bg-white/80 backdrop-blur-lg border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Back + Breadcrumbs */}
          <div className="flex items-center gap-4">
            {showBack && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all group"
              >
                <svg 
                  className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">{backLabel}</span>
              </button>
            )}

            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="hidden sm:flex items-center gap-2 text-sm">
                <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
                  🏠
                </Link>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <span className="text-gray-300">/</span>
                    {crumb.path ? (
                      <Link 
                        to={crumb.path} 
                        className="text-gray-500 hover:text-indigo-600 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-gray-700 font-medium">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>

          {/* Center: Title */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-gray-800">{title}</h1>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {actions}
          </div>
        </div>
      </div>
    </header>
  );
};

// ==========================================
// Quick Navigation Bar - סרגל ניווט מהיר
// ==========================================

interface QuickNavProps {
  items: {
    label: string;
    path: string;
    icon?: string;
    active?: boolean;
  }[];
}

export const QuickNav: React.FC<QuickNavProps> = ({ items }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-lg rounded-full shadow-lg border border-gray-200 px-2 py-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              item.active
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.icon && <span>{item.icon}</span>}
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// Flow Progress Indicator - מחוון התקדמות
// ==========================================

interface FlowStep {
  label: string;
  completed?: boolean;
  active?: boolean;
}

interface FlowProgressProps {
  steps: FlowStep[];
  currentStep: number;
}

export const FlowProgress: React.FC<FlowProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          {/* Step Circle */}
          <div 
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
              index < currentStep
                ? 'bg-green-500 text-white'
                : index === currentStep
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white ring-4 ring-indigo-100'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {index < currentStep ? '✓' : index + 1}
          </div>
          
          {/* Step Label */}
          <span 
            className={`text-sm font-medium hidden sm:block ${
              index === currentStep ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            {step.label}
          </span>
          
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div 
              className={`w-8 sm:w-16 h-1 rounded-full ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default NavigationHeader;
