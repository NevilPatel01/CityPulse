import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, Button } from '../../components/ui';
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton';
import { AuthDivider } from '../../components/auth/AuthDivider';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Set page title for accessibility
  useEffect(() => {
    document.title = 'Login - CityPulse';
    
    // Announce page load to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'Login page loaded';
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);

    return () => {
      document.title = 'CityPulse';
    };
  }, []);

  const validateForm = (): LoginFormErrors => {
    const newErrors: LoginFormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      
      // Announce validation errors to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Form validation failed. ${Object.keys(formErrors).length} errors found.`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 3000);
      
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await login(formData.email, formData.password, rememberMe);
      
      // Announce successful login
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Login successful. Redirecting to dashboard.';
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 2000);
      
      // Redirect to dashboard after successful login
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Login failed. Please try again.';
      setErrors({ general: errorMessage });
      
      // Announce login failure
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Login failed: ${errorMessage}`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue your journey"
    >
      <form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        noValidate
        role="form"
        aria-label="Login form"
      >
        {/* General error message */}
        {errors.general && (
          <div 
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-2">
              <svg 
                className="w-5 h-5 mt-0.5 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span>{errors.general}</span>
            </div>
          </div>
        )}

        <fieldset className="space-y-6">
          <legend className="sr-only">Login credentials</legend>
          
          {/* Email field */}
          <Input
            type="email"
            label="Email address"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            disabled={isLoading}
            autoComplete="email"
            isRequired={true}
            aria-describedby={errors.email ? `email-error` : undefined}
          />

          {/* Password field */}
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={errors.password}
            disabled={isLoading}
            autoComplete="current-password"
            isRequired={true}
            aria-describedby={errors.password ? `password-error` : undefined}
          />
        </fieldset>

        {/* Remember Me and Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-subtle bg-gray-700 text-pulse focus:ring-2 focus:ring-pulse focus:ring-offset-2 focus:ring-offset-base transition-colors cursor-pointer"
              disabled={isLoading}
              aria-label="Remember me on this device"
            />
            <span className="text-sm text-muted group-hover:text-primary transition-colors duration-200">
              Remember me
            </span>
          </label>
          
          <Link
            to="/reset-password"
            className="text-sm text-pulse hover:underline hover:text-pulse/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2 focus:ring-offset-base rounded"
            aria-label="Reset your password if you forgot it"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          isLoading={isLoading}
          loadingText="Signing in..."
          ariaLabel={isLoading ? "Signing in, please wait" : "Sign in to your account"}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      {/* OAuth Section */}
      <section className="mt-6" aria-labelledby="oauth-heading">
        <h3 id="oauth-heading" className="sr-only">Alternative sign in methods</h3>
        <AuthDivider text="or continue with" />
        
        <GoogleOAuthButton 
          text="Sign in with Google"
        />
      </section>

      {/* Sign up link */}
      <footer className="text-center pt-6 mt-6 border-t border-subtle">
        <p className="text-muted text-sm">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-pulse hover:underline hover:text-pulse/80 transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2 focus:ring-offset-base rounded"
            aria-label="Sign up for a new CityPulse account"
          >
            Sign up for free
          </Link>
        </p>
      </footer>
    </AuthLayout>
  );
};

export default LoginPage;