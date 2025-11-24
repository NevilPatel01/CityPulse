import { useMemo } from 'react';
import { calculatePasswordStrength, requirements } from '../../utils/passwordUtils';

interface PasswordStrengthProps {
    password: string;
    showRequirements?: boolean;
}

export const PasswordStrengthMeter = ({ password, showRequirements = true }: PasswordStrengthProps) => {
    const strength = useMemo(() => calculatePasswordStrength(password), [password]);

    if (!password) {
        return null;
    }

    return (
        <div className="space-y-3">
            {/* Strength Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Password Strength</span>
                    {strength.label && (
                        <span className={`font-medium ${
                            strength.label === 'Weak' ? 'text-red-400' :
                            strength.label === 'Fair' ? 'text-orange-400' :
                            strength.label === 'Good' ? 'text-yellow-400' :
                            'text-green-400'
                        }`}>
                            {strength.label}
                        </span>
                    )}
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                    />
                </div>
            </div>

            {/* Requirements Checklist */}
            {showRequirements && (
                <div className="space-y-1.5">
                    <p className="text-xs text-muted">Password must contain:</p>
                    <ul className="space-y-1">
                        {requirements.map((req, index) => {
                            const passed = req.test(password);
                            return (
                                <li
                                    key={index}
                                    className={`text-xs flex items-center gap-2 transition-colors ${
                                        passed ? 'text-green-400' : 'text-muted'
                                    }`}
                                >
                                    <svg
                                        className={`w-4 h-4 flex-shrink-0 ${passed ? 'text-green-400' : 'text-gray-600'}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        {passed ? (
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        ) : (
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
                                        )}
                                    </svg>
                                    <span>{req.label}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};
