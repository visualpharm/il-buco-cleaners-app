// Sync object
const config = {
  verbose: true,
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(mongodb|bson|bson-ext|kerberos|mongodb-connection-string-url|socks|aws4|snappy|@aws-sdk|snappy/package\\.json|mongodb-client-encryption|dns|fs|os|tls|net|child_process)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/__tests__/**/*.spec.ts',
    '**/__tests__/**/*.spec.tsx'
  ],
  forceExit: true,
  testTimeout: 30000,
  detectOpenHandles: true,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
      isolatedModules: true,
    },
  },
};

module.exports = config;
