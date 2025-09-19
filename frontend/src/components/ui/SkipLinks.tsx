import React from 'react';

interface SkipLink {
    href: string;
    label: string;
}

interface SkipLinksProps {
    links?: SkipLink[];
}

const defaultLinks: SkipLink[] = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' },
];

export const SkipLinks: React.FC<SkipLinksProps> = ({
    links = defaultLinks,
}) => {
    return (
        <nav
            className='sr-only focus-within:not-sr-only'
            aria-label='Skip navigation links'
        >
            <ul className='fixed top-4 left-4 z-50 space-y-2'>
                {links.map((link, index) => (
                    <li key={index}>
                        <a
                            href={link.href}
                            className='bg-pulse text-pulse-fg px-4 py-2 rounded-lg font-medium transition-all duration-200 
                            focus:outline-none focus:ring-2 focus:ring-pulse-fg focus:ring-offset-2 focus:ring-offset-pulse
                            hover:opacity-90 block'
                        >
                            {link.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
