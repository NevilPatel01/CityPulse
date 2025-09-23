import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base">
      <Header />
      
      <main className="pt-16 px-4 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="max-w-md w-full text-center">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-pulse/5 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-pulse/5 blur-3xl"></div>
          </div>

          {/* 404 Card */}
          <div className="relative bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl shadow-glass p-8">
            {/* Large 404 */}
            <div className="text-8xl font-bold text-pulse mb-4 opacity-20">
              404
            </div>
            
            {/* Icon */}
            <div className="text-6xl mb-6">🧭</div>
            
            {/* Heading */}
            <h1 className="text-3xl font-bold text-primary mb-4">
              Page Not Found
            </h1>
            
            {/* Description */}
            <p className="text-muted mb-8 leading-relaxed">
              Oops! It looks like you've wandered off the beaten path. 
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-pulse text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 hover:shadow-lg hover:shadow-pulse/25 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <span className="mr-2">🏠</span>
                Go Home
              </button>
              
              <button
                onClick={() => navigate(-1)}
                className="w-full border border-subtle text-primary py-3 px-6 rounded-lg font-medium hover:bg-surface-glass transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <span className="mr-2">←</span>
                Go Back
              </button>
            </div>
            
            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-subtle">
              <p className="text-sm text-muted">
                Need help? 
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-pulse hover:underline ml-1"
                >
                  Visit your dashboard
                </button>
                {' '}or{' '}
                <button 
                  onClick={() => navigate('/about')}
                  className="text-pulse hover:underline"
                >
                  learn more about CityPulse
                </button>
              </p>
            </div>
          </div>
          
          {/* Additional Help */}
          <div className="mt-6 text-sm text-muted">
            <p>Lost? Here are some popular destinations:</p>
            <div className="flex justify-center space-x-4 mt-2">
              <button 
                onClick={() => navigate('/features')}
                className="text-pulse hover:underline"
              >
                Features
              </button>
              <button 
                onClick={() => navigate('/about')}
                className="text-pulse hover:underline"
              >
                About
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="text-pulse hover:underline"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}