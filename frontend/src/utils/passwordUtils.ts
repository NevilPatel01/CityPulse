interface PasswordRequirement {
    label: string;
    test: (password: string) => boolean;
}

export const requirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'Contains uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'Contains lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'Contains number', test: (pwd) => /[0-9]/.test(pwd) },
    { label: 'Contains special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
];

export const calculatePasswordStrength = (password: string): {
    score: number;
    label: string;
    color: string;
} => {
    if (!password) {
        return { score: 0, label: '', color: 'bg-gray-600' };
    }

    const passedRequirements = requirements.filter(req => req.test(password)).length;
    const score = (passedRequirements / requirements.length) * 100;

    if (score < 40) {
        return { score, label: 'Weak', color: 'bg-red-500' };
    } else if (score < 60) {
        return { score, label: 'Fair', color: 'bg-orange-500' };
    } else if (score < 80) {
        return { score, label: 'Good', color: 'bg-yellow-500' };
    } else {
        return { score, label: 'Strong', color: 'bg-green-500' };
    }
};
