import type { ReactNode } from 'react';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className='min-h-screen bg-base text-primary flex flex-col'>
      <Header />

      <main className='flex-1 flex items-center justify-center px-4 py-12'>
        <div className='w-full max-w-md'>
          {/* Background decorative elements */}
          <div className='absolute inset-0 overflow-hidden pointer-events-none'>
            <div className='absolute -top-40 -right-40 w-80 h-80 rounded-full bg-pulse/5 blur-3xl'></div>
            <div className='absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-pulse/5 blur-3xl'></div>
          </div>

          {/* Auth card */}
          <div className='relative bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl shadow-glass p-8'>
            {/* Header */}
            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold text-primary mb-2'>{title}</h1>
              {subtitle && <p className='text-muted'>{subtitle}</p>}
            </div>

            {/* Form content */}
            {children}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
