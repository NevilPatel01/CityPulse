import React, { useState } from 'react';
import { Button } from '../ui/button';

interface ResetPasswordFormProps {
  onSubmit: (password: string) => void;
  loading?: boolean;
  error?: string;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSubmit,
  loading = false,
  error,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('at least 8 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('one special character');
    }
    
    return errors;
  };

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    
    const errors = validatePassword(newPassword);
    setValidationErrors(prev => ({
      ...prev,
      password: errors.length > 0 ? `Password must contain ${errors.join(', ')}` : undefined
    }));
  };

  const handleConfirmPasswordChange = (newConfirmPassword: string) => {
    setConfirmPassword(newConfirmPassword);
    
    setValidationErrors(prev => ({
      ...prev,
      confirmPassword: newConfirmPassword && newConfirmPassword !== password 
        ? 'Passwords do not match' 
        : undefined
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordErrors = validatePassword(password);
    const confirmError = password !== confirmPassword ? 'Passwords do not match' : undefined;
    
    if (passwordErrors.length > 0 || confirmError) {
      setValidationErrors({
        password: passwordErrors.length > 0 ? `Password must contain ${passwordErrors.join(', ')}` : undefined,
        confirmPassword: confirmError
      });
      return;
    }
    
    onSubmit(password);
  };

  const isFormValid = 
    password && 
    confirmPassword && 
    password === confirmPassword && 
    validatePassword(password).length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              disabled={loading}
              required
              className={`
                w-full px-4 py-3 pr-12
                bg-surface-glass backdrop-blur-glass 
                border border-subtle rounded-lg
                text-primary placeholder:text-muted
                focus:outline-none focus:ring-2 focus:ring-pulse focus:border-pulse focus:shadow-lg focus:shadow-pulse/20
                hover:border-pulse/50 hover:shadow-md hover:shadow-pulse/10
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                ${
                  validationErrors.password
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 hover:border-red-500'
                    : ''
                }
              `}
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              disabled={loading}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L7.293 7.293m13.414 13.414L19.293 19.293m1.414 1.414L12 4.586l8.707 8.707" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {validationErrors.password && (
            <p className='text-sm text-red-500'>{validationErrors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              disabled={loading}
              required
              className={`
                w-full px-4 py-3 pr-12
                bg-surface-glass backdrop-blur-glass 
                border border-subtle rounded-lg
                text-primary placeholder:text-muted
                focus:outline-none focus:ring-2 focus:ring-pulse focus:border-pulse focus:shadow-lg focus:shadow-pulse/20
                hover:border-pulse/50 hover:shadow-md hover:shadow-pulse/10
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                ${
                  validationErrors.confirmPassword
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 hover:border-red-500'
                    : ''
                }
              `}
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              disabled={loading}
            >
              {showConfirmPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L7.293 7.293m13.414 13.414L19.293 19.293m1.414 1.414L12 4.586l8.707 8.707" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className='text-sm text-red-500'>{validationErrors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Password Requirements */}
      <div className="bg-surface-glass/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-primary mb-3">Password Requirements:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { rule: 'At least 8 characters', test: password.length >= 8 },
            { rule: 'One lowercase letter', test: /[a-z]/.test(password) },
            { rule: 'One uppercase letter', test: /[A-Z]/.test(password) },
            { rule: 'One number', test: /\d/.test(password) },
            { rule: 'One special character', test: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
          ].map((requirement, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                requirement.test ? 'bg-green-500' : 'bg-surface-glass'
              }`} />
              <span className={requirement.test ? 'text-green-400' : 'text-muted'}>
                {requirement.rule}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!isFormValid || loading}
      >
        {loading ? 'Resetting Password...' : 'Reset Password'}
      </Button>
    </form>
  );
};