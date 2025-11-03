import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SearchOverlayProvider } from './context/SearchOverlayContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import GlobalSearchOverlay from './components/search/GlobalSearchOverlay';
import LandingPage from './components/landing/LandingPage';

import AboutPage from './pages/AboutPage.tsx';
import FeaturesPage from './pages/FeaturesPage.tsx';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import GoogleOAuthCallback from './pages/auth/GoogleOAuthCallback';
import Dashboard from './pages/Dashboard.tsx';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { CreateRecommendationPage } from './pages/CreateRecommendationPage';
import { RecommendationDetailPage } from './pages/RecommendationDetailPage';
import { EditRecommendationPage } from './pages/EditRecommendationPage';
import BuddiesPage from './pages/BuddiesPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  useEffect(() => {
    console.log('🚀 [APP] CityPulse App initialized');
    console.log('🌍 [APP] Current URL:', window.location.href);
    console.log('🔧 [APP] Environment:', import.meta.env.MODE);
    console.log('🔌 [APP] API URL:', import.meta.env.VITE_API_URL);
    
    // Log navigation changes
    const handleLocationChange = () => {
      console.log('🧭 [APP] Navigation to:', window.location.pathname);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <SearchOverlayProvider>
          <Router>
            <GlobalSearchOverlay />
            <Routes>
              {/* Public routes - accessible without authentication */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/features" element={<FeaturesPage />} />
          
          {/* Auth routes - only accessible when NOT authenticated */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          } />
          <Route path="/reset-password" element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          } />
          <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
          
          {/* Protected routes - require authentication */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile/:username" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          } />
          
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/recommendations/create" element={
            <ProtectedRoute>
              <CreateRecommendationPage />
            </ProtectedRoute>
          } />
          <Route path="/recommendations/:id" element={
            <ProtectedRoute>
              <RecommendationDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/recommendations/:id/edit" element={
            <ProtectedRoute>
              <EditRecommendationPage />
            </ProtectedRoute>
          } />
          
          {/* Buddies/Social routes */}
          <Route path="/buddies" element={
            <ProtectedRoute>
              <BuddiesPage />
            </ProtectedRoute>
          } />
          
          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
        </SearchOverlayProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App
