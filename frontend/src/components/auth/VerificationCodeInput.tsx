import React, { useState, useRef, type KeyboardEvent } from 'react';
import { Button } from '../ui/button';

interface VerificationCodeInputProps {
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading?: boolean;
  isResending?: boolean;
  email: string;
}

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  onSubmit,
  onResend,
  isLoading = false,
  isResending = false,
  email,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last character
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasteData[i] || '';
    }
    
    setCode(newCode);
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newCode.findIndex(c => c === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      await onSubmit(fullCode);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid verification code');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary">Enter Verification Code</h2>
        <p className="text-muted">
          We sent a 6-digit code to <strong className="text-primary">{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Code Input Grid */}
        <div className="flex justify-center gap-3">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`
                w-12 h-14 text-center text-2xl font-bold
                bg-surface-glass border-2 rounded-lg
                text-primary placeholder:text-muted
                focus:outline-none focus:border-pulse focus:ring-2 focus:ring-pulse/20
                transition-all duration-200
                ${error ? 'border-red-500' : 'border-subtle'}
              `}
              disabled={isLoading}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || code.join('').length !== 6}
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </Button>
      </form>

      {/* Resend Code */}
      <div className="text-center space-y-4">
        <p className="text-muted text-sm">
          Didn't receive the code?
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={onResend}
          disabled={isResending}
          className="text-pulse hover:text-pulse/80"
        >
          {isResending ? 'Sending...' : 'Resend Code'}
        </Button>
      </div>

      {/* Helper Text */}
      <div className="text-center">
        <p className="text-muted text-xs">
          Code expires in 15 minutes. Check your spam folder if you don't see it.
        </p>
      </div>
    </div>
  );
};