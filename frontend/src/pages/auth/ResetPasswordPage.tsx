import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, Button } from '../../components/ui';
import { VerificationCodeInput } from '../../components/auth/VerificationCodeInput';
import { ResetPasswordForm } from '../../components/auth/ResetPasswordForm';
import { apiEndpoints, apiRequestWithExtendedTimeout } from '../../config/api';

interface ResetFormData {
  email: string;
}

interface ResetFormErrors {
  email?: string;
  general?: string;
}

interface RequestResetResponse {
  message: string;
  success: boolean;
  resetToken: string;
}

interface VerifyCodeResponse {
  message: string;
  success: boolean;
  token: string;
}

interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

type ResetStep = 'email' | 'verification' | 'password' | 'success';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<ResetStep>('email');
  const [formData, setFormData] = useState<ResetFormData>({ email: '' });
  const [errors, setErrors] = useState<ResetFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleEmailSubmit = async (email: string) => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await apiRequestWithExtendedTimeout<RequestResetResponse>(
        apiEndpoints.auth.requestPasswordReset,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      setFormData({ email });
      setResetToken(response.resetToken);
      setCurrentStep('verification');
      setResendCooldown(60);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to send reset email. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!resetToken) {
      setErrors({ general: 'Reset session expired. Please request a new reset code.' });
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setErrors({ general: 'Security code must be exactly 6 digits.' });
      return;
    }

    const payload = { 
      resetToken: resetToken,
      securityCode: code 
    };

    setIsLoading(true);
    setErrors({});

    try {
      await apiRequestWithExtendedTimeout<VerifyCodeResponse>(
        apiEndpoints.auth.verifyResetCode,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      setCurrentStep('password');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Invalid verification code. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await apiRequestWithExtendedTimeout<RequestResetResponse>(
        apiEndpoints.auth.requestPasswordReset,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formData.email }),
        }
      );

      setResetToken(response.resetToken);
      setResendCooldown(60);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to resend code. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    setIsLoading(true);
    setErrors({});

    try {
      await apiRequestWithExtendedTimeout<ResetPasswordResponse>(
        apiEndpoints.auth.resetPassword,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resetToken: resetToken,
            newPassword: newPassword,
          }),
        }
      );

      setCurrentStep('success');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to reset password. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setCurrentStep('email');
    setFormData({ email: '' });
    setErrors({});
    setResetToken('');
  };

  return (
    <AuthLayout
      title={
        currentStep === 'email' ? 'Reset Your Password' :
        currentStep === 'verification' ? 'Check Your Email' :
        currentStep === 'password' ? 'Set New Password' :
        'Password Reset Complete'
      }
      subtitle={
        currentStep === 'email' ? 'Enter your email address and we\'ll send you a security code.' :
        currentStep === 'verification' ? `We've sent a 6-digit security code to ${formData.email}` :
        currentStep === 'password' ? 'Enter your new password below.' :
        'Your password has been successfully reset.'
      }
    >
      <div className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {errors.general}
          </div>
        )}

        {currentStep === 'email' && (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get('email') as string;
            if (email) handleEmailSubmit(email);
          }}>
            <div className="space-y-4">
              <div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Security Code'}
              </Button>
            </div>
          </form>
        )}

        {currentStep === 'verification' && (
          <VerificationCodeInput
            onSubmit={handleVerifyCode}
            onResend={handleResendCode}
            isLoading={isLoading}
            isResending={isLoading}
            email={formData.email}
          />
        )}

        {currentStep === 'password' && (
          <ResetPasswordForm
            onSubmit={handleResetPassword}
            loading={isLoading}
          />
        )}

        {currentStep === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600">
              You can now sign in with your new password.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Return to Sign In
            </Button>
          </div>
        )}

        {currentStep !== 'success' && (
          <div className="text-center">
            <Link
              to="/login"
              className="text-pulse hover:underline hover:text-pulse/80 transition-colors duration-200 font-medium"
              onClick={handleBackToLogin}
            >
              Back to Sign In 
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;