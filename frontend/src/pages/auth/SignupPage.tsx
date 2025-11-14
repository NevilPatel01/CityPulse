import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, Button } from '../../components/ui';
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton';
import { AuthDivider } from '../../components/auth/AuthDivider';
import { useAuth } from '../../hooks/useAuth';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  fullName: string;
  acceptTerms: boolean;
}

interface SignupFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
  fullName?: string;
  acceptTerms?: string;
  general?: string;
}

const SignupPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // Check if all required fields are filled
  const isFormComplete = 
    formData.username.trim() !== '' &&
    formData.fullName.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.password !== '' &&
    formData.confirmPassword !== '' &&
    formData.acceptTerms;

  // Check if form is valid for submission
  const isFormValid = isFormComplete && passwordsMatch && Object.keys(errors).length === 0;

  const validateForm = (): SignupFormErrors => {
    const newErrors: SignupFormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = 'Username must only contain alphanumeric characters';
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters long';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms acceptance validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof SignupFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'acceptTerms' ? e.target.checked : e.target.value;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Check if passwords match after update
      if (field === 'password' || field === 'confirmPassword') {
        const pass = field === 'password' ? value as string : updated.password;
        const confirmPass = field === 'confirmPassword' ? value as string : updated.confirmPassword;
        setPasswordsMatch(pass !== '' && confirmPass !== '' && pass === confirmPass);
      }
      
      return updated;
    });
    
    // Clear field error when user starts typing/changing
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
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await register({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        fullName: formData.fullName,
      });
      
      // Redirect to dashboard after successful registration
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Registration failed. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join thousands of travelers discovering authentic local experiences"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General error message */}
        {errors.general && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {errors.general}
          </div>
        )}

        {/* Username and Full Name fields */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            label="Username"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleInputChange('username')}
            error={errors.username}
            disabled={isLoading}
            autoComplete="username"
            required
          />
          <Input
            type="text"
            label="Full name"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            error={errors.fullName}
            disabled={isLoading}
            autoComplete="name"
            required
          />
        </div>

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
          required
        />

        {/* Password field */}
        <Input
          type="password"
          label="Password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={handleInputChange('password')}
          error={errors.password}
          helperText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
          disabled={isLoading}
          autoComplete="new-password"
          required
        />

        {/* Confirm password field */}
        <Input
          type="password"
          label="Confirm password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          error={errors.confirmPassword}
          success={passwordsMatch}
          disabled={isLoading}
          autoComplete="new-password"
          required
        />

        {/* Terms acceptance */}
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={handleInputChange('acceptTerms')}
              disabled={isLoading}
              className="mt-0.5 w-4 h-4 text-pulse bg-surface-glass border-subtle rounded focus:ring-pulse focus:ring-2"
            />
            <span className="text-sm text-muted leading-relaxed">
              I agree to the{' '}
              <Link to="/terms" className="text-pulse hover:underline hover:text-pulse/80 transition-colors duration-200">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-pulse hover:underline hover:text-pulse/80 transition-colors duration-200">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-sm text-red-500 ml-7">
              {errors.acceptTerms}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !isFormValid}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      {/* OAuth Section */}
      <div className="mt-6">
        <AuthDivider text="or sign up with" />
        
        <GoogleOAuthButton 
          text="Sign up with Google"
        />
      </div>

      {/* Sign in link */}
      <div className="text-center pt-6 mt-6 border-t border-subtle">
          <p className="text-muted text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-pulse hover:underline hover:text-pulse/80 transition-colors duration-200 font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
    </AuthLayout>
  );
};

export default SignupPage;