import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button } from '../../components/ui';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch {
        setStatus('error');
        setMessage('An error occurred during verification.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Verifying your email address"
    >
      <div className="text-center space-y-6">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-pulse border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email Verified!</h3>
              <p className="text-muted text-sm">{message}</p>
            </div>
            <Link to="/login" className="block w-full">
              <Button className="w-full">Continue to Login</Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Verification Failed</h3>
              <p className="text-muted text-sm">{message}</p>
            </div>
            <Link to="/signup" className="block w-full">
              <Button variant="outline" className="w-full">Back to Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default EmailVerificationPage;
