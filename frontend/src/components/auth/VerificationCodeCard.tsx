import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { VerificationCodeInput } from '../ui/VerificationCodeInput';

interface VerificationCodeCardProps {
  email: string;
  onVerify: (code: string) => void;
  onResendCode: () => void;
  onBack: () => void;
  loading?: boolean;
  error?: string;
  resendCooldown?: number;
}

export const VerificationCodeCard: React.FC<VerificationCodeCardProps> = ({
  email,
  onVerify,
  onResendCode,
  onBack,
  loading = false,
  error,
  resendCooldown = 0,
}) => {
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(resendCooldown);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  useEffect(() => {
    setCountdown(resendCooldown);
  }, [resendCooldown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onVerify(code);
    }
  };

  const handleResend = () => {
    setCode('');
    onResendCode();
  };

  const isCodeComplete = code.length === 6;
  const canResend = countdown === 0 && !loading;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-surface-glass backdrop-blur-glass rounded-2xl p-8 shadow-glass border border-subtle">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pulse/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Verify Your Email</h2>
          <p className="text-muted">
            We've sent a 6-digit verification code to{' '}
            <span className="text-primary font-medium">{email}</span>
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <VerificationCodeInput
            value={code}
            onChange={setCode}
            disabled={loading}
            error={error}
            autoFocus
          />

          <Button
            type="submit"
            className="w-full"
            disabled={!isCodeComplete || loading}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </form>

        {/* Resend Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted mb-3">
            Didn't receive the code?
          </p>
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-pulse hover:text-pulse/80 font-medium text-sm transition-colors"
            >
              Resend verification code
            </button>
          ) : (
            <p className="text-muted text-sm">
              Resend code in {countdown}s
            </p>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6 pt-6 border-t border-subtle">
          <button
            onClick={onBack}
            className="text-muted hover:text-primary transition-colors text-sm flex items-center justify-center w-full"
            disabled={loading}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to email entry
          </button>
        </div>
      </div>
    </div>
  );
};