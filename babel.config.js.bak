module.exports = (api) => {
  const isTest = api.env('test');

  if (isTest) {
    // Configuration for Jest (test environment)
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        // Use 'transform' instead of 'proposal' for class properties
        ['@babel/plugin-transform-class-properties', { loose: true }],
        // Ensure private methods support for tests if needed
        ['@babel/plugin-transform-private-methods', { loose: true }],
        // Decorators if used in tested code
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        '@babel/plugin-transform-runtime',
      ],
    };
  } else {
    // Configuration for Next.js (development/production)
    // This configuration will be used by Next.js because babel.config.js exists,
    // which means SWC will be disabled in favor of Babel.
    return {
      presets: [
        'next/babel', // Standard Next.js Babel preset
      ],
      plugins: [
        // Add any application-wide Babel plugins not covered by 'next/babel'.
        // For example, if decorators are used throughout the application:
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        // Note: 'next/babel' should handle class properties. If specific issues arise,
        // '@babel/plugin-transform-class-properties' might be needed here too.
      ],
    };
  }
};
