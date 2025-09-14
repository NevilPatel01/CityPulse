import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, Button } from '../../components/ui';
import { apiEndpoints, apiRequest } from '../../config/api';

interface ResetFormData {
  email: string;
}

interface ResetFormErrors {
  email?: string;
  general?: string;
}

interface ResetPasswordResponse {
  message: string;
  success: boolean;
}


const ResetPasswordPage = () => {
  const [formData, setFormData] = useState<ResetFormData>({
    email: '',
  });
  const [errors, setErrors] = useState<ResetFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): ResetFormErrors => {
    const newErrors: ResetFormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({
        ...prev,
        email: undefined
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
      await apiRequest<ResetPasswordResponse>(
        apiEndpoints.auth.resetPassword,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      setIsSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to send reset email. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent password reset instructions to your email address"
      >
        <div className="text-center space-y-6">
          {/* Success icon */}
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg 
              className="w-8 h-8 text-green-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>

          {/* Success message */}
          <div className="space-y-4">
            <p className="text-muted leading-relaxed">
              If an account with <strong className="text-primary">{formData.email}</strong> exists, 
              you'll receive an email with instructions to reset your password.
            </p>
            <p className="text-sm text-muted">
              Didn't receive the email? Check your spam folder or try again in a few minutes.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-4 pt-4">
            <Button
              onClick={() => {
                setIsSuccess(false);
                setFormData({ email: '' });
                setErrors({});
              }}
              variant="outline"
              className="w-full"
            >
              Send another email
            </Button>
            
            <div className="text-center">
              <Link
                to="/login"
                className="text-pulse hover:underline hover:text-pulse/80 transition-colors duration-200 text-sm font-medium"
              >
                ← Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email address and we'll send you instructions to reset your password"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General error message */}
        {errors.general && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {errors.general}
          </div>
        )}

        {/* Email field */}
        <Input
          type="email"
          label="Email address"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          disabled={isLoading}
          autoComplete="email"
          autoFocus
          required
        />

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Sending instructions...' : 'Send reset instructions'}
        </Button>

        {/* Back to login link */}
        <div className="text-center pt-4 border-t border-subtle">
          <Link
            to="/login"
            className="text-pulse hover:underline hover:text-pulse/80 transition-colors duration-200 text-sm font-medium"
          >
            ← Back to sign in
          </Link>
        </div>

        {/* Additional help */}
        <div className="text-center">
          <p className="text-muted text-sm">
            Need help?{' '}
            <a 
              href="mailto:support@citypulse.com" 
              className="text-pulse hover:underline hover:text-pulse/80 transition-colors duration-200"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;