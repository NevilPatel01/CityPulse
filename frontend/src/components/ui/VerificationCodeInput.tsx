import React, { useState, useRef, useEffect } from 'react';

interface VerificationCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
}

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  value,
  onChange,
  disabled = false,
  error,
  autoFocus = false,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    const sanitizedValue = newValue.replace(/[^0-9]/g, '');
    
    if (sanitizedValue.length > 1) {
      // Handle paste scenario
      const pastedValue = sanitizedValue.slice(0, length);
      onChange(pastedValue);
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedValue.length, length - 1);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
      return;
    }

    // Update the value at the specific index
    const newCode = value.split('');
    newCode[index] = sanitizedValue;
    
    // Trim the array to the correct length and join
    const updatedValue = newCode.slice(0, length).join('').slice(0, length);
    onChange(updatedValue);

    // Auto-focus next input if value was entered
    if (sanitizedValue && index < length - 1) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // If current input is empty, focus previous input
        const prevInput = inputRefs.current[index - 1];
        if (prevInput) {
          prevInput.focus();
        }
      } else {
        // Clear current input
        const newCode = value.split('');
        newCode[index] = '';
        onChange(newCode.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    const pastedValue = pastedData.slice(0, length);
    onChange(pastedValue);
    
    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedValue.length, length - 1);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-3">
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              w-12 h-14 text-center text-2xl font-mono font-bold
              bg-surface-glass backdrop-blur-glass
              border rounded-lg
              focus:outline-none focus:ring-2 focus:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              ${
                error
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500 text-red-400'
                  : focusedIndex === index
                  ? 'border-pulse focus:ring-pulse focus:border-pulse focus:shadow-pulse/20 text-primary'
                  : 'border-subtle text-primary hover:border-pulse/50'
              }
            `}
            style={{ 
              color: error ? '#f87171' : 'var(--text-primary)',
              caretColor: 'var(--pulse)'
            }}
          />
        ))}
      </div>
      
      {error && (
        <p className="text-sm text-red-500 text-center">
          {error}
        </p>
      )}
      
      <div className="text-center">
        <p className="text-sm text-muted">
          Enter the 6-digit code sent to your email
        </p>
      </div>
    </div>
  );
};