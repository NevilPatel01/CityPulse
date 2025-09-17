import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import LandingPage from './components/landing/LandingPage';

import AboutPage from './pages/AboutPage.tsx';
import FeaturesPage from './pages/FeaturesPage.tsx';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import GoogleOAuthCallback from './pages/auth/GoogleOAuthCallback';
import Dashboard from './pages/Dashboard.tsx';

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
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App
