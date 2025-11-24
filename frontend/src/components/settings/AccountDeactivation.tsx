import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSafeToast } from '../../hooks/useSafeToast';
import { apiRequest } from '../../config/api';
import { Button } from '../ui/button';

export const AccountDeactivation = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { showSuccess, showError } = useSafeToast();
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [password, setPassword] = useState('');
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const handleDeactivate = async () => {
        if (!password) {
            showError('Password Required', 'Please enter your password to confirm.');
            return;
        }

        setIsDeactivating(true);
        try {
            await apiRequest('/api/profile/deactivate', {
                method: 'POST',
                body: JSON.stringify({ password })
            });

            showSuccess(
                'Account Deactivated',
                'Your account has been deactivated. You can reactivate it by logging in within 30 days.',
                5000
            );

            // Logout and redirect
            setTimeout(async () => {
                await logout();
                navigate('/login');
            }, 2000);

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate account. Please try again.';
            showError(
                'Deactivation Failed',
                errorMessage,
                5000
            );
        } finally {
            setIsDeactivating(false);
        }
    };

    const openConfirmModal = () => {
        setShowConfirmModal(true);
        setCountdown(5);
        
        // Countdown timer
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <>
            <div className="bg-surface-glass backdrop-blur-glass border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/20 rounded-full">
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Deactivate Account</h3>
                        <p className="text-muted text-sm mb-4">
                            Deactivating your account will hide your profile and content from other users. 
                            You can reactivate your account by logging in within 30 days. After 30 days, 
                            your account and all data will be permanently deleted.
                        </p>
                        <ul className="text-sm text-muted space-y-2 mb-4">
                            <li className="flex items-start gap-2">
                                <span className="text-red-400">•</span>
                                <span>Your profile will be hidden from other users</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-400">•</span>
                                <span>Your recommendations will be hidden</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-400">•</span>
                                <span>Your buddy connections will be suspended</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-400">•</span>
                                <span>You have 30 days to reactivate before permanent deletion</span>
                            </li>
                        </ul>
                        <Button
                            onClick={openConfirmModal}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Deactivate Account
                        </Button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-red-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-500/20 rounded-full">
                                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Confirm Deactivation</h3>
                        </div>
                        
                        <p className="text-gray-300 mb-4">
                            This action will deactivate your account. Are you absolutely sure you want to proceed?
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Enter your password to confirm
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Your password"
                                disabled={isDeactivating}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setPassword('');
                                }}
                                variant="outline"
                                className="flex-1"
                                disabled={isDeactivating}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeactivate}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                disabled={isDeactivating || countdown > 0 || !password}
                                isLoading={isDeactivating}
                            >
                                {isDeactivating ? 'Deactivating...' : countdown > 0 ? `Wait ${countdown}s` : 'Deactivate'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
