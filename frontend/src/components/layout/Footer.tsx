import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className='bg-surface-glass border-t border-subtle py-16 px-4'>
      <div className='container mx-auto'>
        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8'>
          {/* Brand */}
          <div>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-8 h-8 rounded-full bg-pulse flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>CP</span>
              </div>
              <span className='font-bold text-xl text-primary'>CityPulse</span>
            </div>
            <p className='text-muted text-sm mb-4'>
              Discover authentic local experiences in every city around the
              world.
            </p>
            <div className='flex gap-4'>
              <a href='#' className='text-muted hover:text-pulse text-xl'>
                📧
              </a>
              <a href='#' className='text-muted hover:text-pulse text-xl'>
                📱
              </a>
              <a href='#' className='text-muted hover:text-pulse text-xl'>
                💬
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className='font-semibold text-primary mb-4'>Product</h4>
            <ul className='space-y-2 text-sm'>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  How it works
                </a>
              </li>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  Local insights
                </a>
              </li>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  Travel buddies
                </a>
              </li>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  Safety tips
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className='font-semibold text-primary mb-4'>Company</h4>
            <ul className='space-y-2 text-sm'>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  About us
                </a>
              </li>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  Careers
                </a>
              </li>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  Contact
                </a>
              </li>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className='font-semibold text-primary mb-4'>Legal</h4>
            <ul className='space-y-2 text-sm'>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href='#' className='text-muted hover:text-primary'>
                  Guidelines
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className='border-t border-subtle pt-8 text-center'>
          <p className='text-muted text-sm'>
            © 2025 CityPulse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
