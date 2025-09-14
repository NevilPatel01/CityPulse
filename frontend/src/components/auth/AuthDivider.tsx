import React from 'react';

interface AuthDividerProps {
  text?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ text = 'or' }) => {
  return (
    <div className='flex items-center my-6'>
      {/* Left line */}
      <div className='flex-1 border-t border-subtle/30'></div>
      
      {/* Text in the middle */}
      <span className='px-6 text-primary font-medium text-sm' style={{ color: 'var(--text-primary)' }}>
        {text}
      </span>
      
      {/* Right line */}
      <div className='flex-1 border-t border-subtle/30'></div>
    </div>
  );
};
