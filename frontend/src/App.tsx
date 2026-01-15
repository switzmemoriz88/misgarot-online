import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Context - MUST wrap the app
import { AuthProvider, useAuthContext } from './contexts';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import EditorPage from './pages/EditorPage';
import ClientPortalPage from './pages/ClientPortalPage';
import CategoryPage from './pages/CategoryPage';
import FramesGalleryPage from './pages/FramesGalleryPage';
import AdminPage from './pages/AdminPage';
import FrameUploadPage from './pages/FrameUploadPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import ClientManagementPage from './pages/ClientManagementPage';
import OrdersManagementPage from './pages/OrdersManagementPage';

import ClientWelcomePage from './pages/ClientWelcomePage';

// Components
import { LanguageToggle } from './components/LanguageToggle';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { UserMenu } from './components';

// Inner component that uses auth context
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuthContext();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - Language Toggle & User Menu */}
      <Routes>
        <Route path="/" element={null} />
        <Route path="/login" element={null} />
        {/* Hide top bar in editor - it has its own header */}
        <Route path="/editor/*" element={null} />
        <Route path="*" element={
          <div className="fixed top-4 left-4 z-[100] pointer-events-none">
            <div className="pointer-events-auto">
              <LanguageToggle />
            </div>
          </div>
        } />
      </Routes>
      
      {/* User Menu - separate for better positioning */}
      <Routes>
        <Route path="/" element={null} />
        <Route path="/login" element={null} />
        <Route path="/editor/*" element={null} />
        <Route path="*" element={
          !isLoading && isAuthenticated ? (
            <div className="fixed top-4 right-4 z-[100] pointer-events-auto" dir="rtl">
              <UserMenu />
            </div>
          ) : null
        } />
      </Routes>
      
      <Routes>
        {/* Landing Page - דף הבית */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        
        {/* Protected Routes - דורשים מנוי פעיל */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfileSettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/clients" element={
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        } />
        
        {/* Flow: קטגוריות → מסגרות → עורך - פתוח לכולם לניסיון */}
        <Route path="/categories" element={<CategoryPage />} />
        <Route path="/frames/:categoryId" element={<FramesGalleryPage />} />
        
        {/* Editor Routes - פתוח לכולם, שמירה/ייצוא דורשים הרשמה */}
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:designId" element={<EditorPage />} />
        <Route path="/editor/landscape/:templateId" element={<EditorPage />} />
        <Route path="/editor/portrait/:designId" element={<EditorPage />} />
        
        {/* Client Portal Routes - לא דורש מנוי */}
        <Route path="/client-welcome" element={<ClientWelcomePage />} />
        <Route path="/client-portal" element={<ClientPortalPage />} />
        <Route path="/client/:clientId" element={<ClientPortalPage />} />
        
        {/* Admin Routes - רק למנהלים */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } />
        <Route path="/admin/frames/new" element={
          <AdminRoute>
            <FrameUploadPage />
          </AdminRoute>
        } />
        <Route path="/admin/orders" element={
          <AdminRoute>
            <OrdersManagementPage />
          </AdminRoute>
        } />
        <Route path="/admin/*" element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } />
        
        {/* Photographer Routes - ניהול לקוחות והזמנות */}
        <Route path="/my-clients" element={
          <ProtectedRoute>
            <ClientManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/my-orders" element={
          <ProtectedRoute>
            <OrdersManagementPage />
          </ProtectedRoute>
        } />
        
        {/* 404 - Redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

// Main App Component
function App() {
  // Translation ready for future use
  useTranslation();

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
