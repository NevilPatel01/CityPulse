// Lighthouse CI Configuration
// For local accessibility testing

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 1,
      startServerCommand: 'echo "Please start frontend server first with: pnpm dev"',
      startServerReadyPattern: 'ready',
      startServerReadyTimeout: 60000,
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './accessibility-reports/lighthouse',
    },
  },
};

