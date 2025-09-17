import React from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';

interface ResetPasswordCardProps {
  email: string;
  onResetPassword: (password: string) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string;
}

export const ResetPasswordCard: React.FC<ResetPasswordCardProps> = ({
  email,
  onResetPassword,
  onBack,
  loading = false,
  error,
}) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-surface-glass backdrop-blur-glass rounded-2xl p-8 shadow-glass border border-subtle">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pulse/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Reset Your Password</h2>
          <p className="text-muted">
            Enter a new password for{' '}
            <span className="text-primary font-medium">{email}</span>
          </p>
        </div>

        {/* Reset Password Form */}
        <ResetPasswordForm
          onSubmit={onResetPassword}
          loading={loading}
          error={error}
        />

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
            Back to verification
          </button>
        </div>
      </div>
    </div>
  );
};