import React from 'react';

interface AuthDividerProps {
  text?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ text = 'or' }) => {
  return (
    <div className='relative my-6'>
      <div className='absolute inset-0 flex items-center'>
        <div className='w-full border-t border-subtle/30' />
      </div>
      <div className='relative flex justify-center text-sm'>
        <span className='bg-surface-glass backdrop-blur-glass px-6 text-muted font-medium'>
          {text}
        </span>
      </div>
    </div>
  );
};
