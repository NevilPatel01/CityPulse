import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SearchOverlayProvider } from './context/SearchOverlayContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import GlobalSearchOverlay from './components/search/GlobalSearchOverlay';
import { ScrollToTop } from './components/layout/ScrollToTop';
import LandingPage from './components/landing/LandingPage';

import AboutPage from './pages/AboutPage.tsx';
import FeaturesPage from './pages/FeaturesPage.tsx';
import TermsOfServicePage from './pages/TermsOfServicePage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import EmailVerificationPage from './pages/auth/EmailVerificationPage';
import GoogleOAuthCallback from './pages/auth/GoogleOAuthCallback';
import Explore from './pages/Explore.tsx';
import ProfilePage from './pages/ProfilePage';
import { EditProfilePage } from './pages/EditProfilePage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';
import { CreateRecommendationPage } from './pages/CreateRecommendationPage';
import { RecommendationDetailPage } from './pages/RecommendationDetailPage';
import { EditRecommendationPage } from './pages/EditRecommendationPage';
import BuddiesPage from './pages/BuddiesPage';
import CityPage from './pages/CityPage';
import NotFoundPage from './pages/NotFoundPage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';
import CompanionFinderPage from './pages/CompanionFinderPage';
import ModeratorDashboard from './pages/ModeratorDashboard';
import LeaderboardPage from './pages/LeaderboardPage';

import { InactivityHandler } from './components/auth/InactivityHandler';

function App() {
  useEffect(() => {
    
    // Log navigation changes
    const handleLocationChange = () => {
    };
    
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <InactivityHandler />
        <SearchOverlayProvider>
          <Router>
            <ScrollToTop />
            <GlobalSearchOverlay />
            <Routes>
              {/* Public routes - accessible without authentication */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
          
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
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          
          {/* Protected routes - require authentication */}
          <Route path="/explore" element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          } />
          <Route path="/explore/*" element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          } />
          <Route path="/profile/:username" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/profile/edit" element={
            <ProtectedRoute>
              <EditProfilePage />
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
          
          <Route path="/create-recommendation" element={
            <ProtectedRoute>
              <CreateRecommendationPage />
            </ProtectedRoute>
          } />
          {/* Legacy routes for backward compatibility */}
          <Route path="/recommendations/:id" element={
            <ProtectedRoute>
              <RecommendationDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/recommendation/:id" element={
            <ProtectedRoute>
              <RecommendationDetailPage />
            </ProtectedRoute>
          } />
          {/* Username-based routes without @ symbol */}
          <Route path="/:username/recommendation/:id" element={
            <ProtectedRoute>
              <RecommendationDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/edit-recommendation/:id" element={
            <ProtectedRoute>
              <EditRecommendationPage />
            </ProtectedRoute>
          } />
          
          {/* Trip Planning routes */}
          <Route path="/trips" element={
            <ProtectedRoute>
              <TripsPage />
            </ProtectedRoute>
          } />
          <Route path="/trips/:id" element={
            <ProtectedRoute>
              <TripDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/trips/companions/find" element={
            <ProtectedRoute>
              <CompanionFinderPage />
            </ProtectedRoute>
          } />
          
          {/* Buddies/Social routes */}
          <Route path="/travel-buddies" element={
            <ProtectedRoute>
              <BuddiesPage />
            </ProtectedRoute>
          } />
          
          {/* Moderator routes */}
          <Route path="/moderator/dashboard" element={
            <ProtectedRoute>
              <ModeratorDashboard />
            </ProtectedRoute>
          } />
          
          {/* Leaderboard route */}
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          } />
          
          {/* City routes */}
          <Route path="/city/:cityName" element={
            <ProtectedRoute>
              <CityPage />
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
