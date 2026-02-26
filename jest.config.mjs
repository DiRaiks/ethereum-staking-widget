export default {
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  modulePathIgnorePatterns: ['./test'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/dist-server/',
    '/dist-ipfs/',
  ],
  // Map SVG and other asset imports to mocks
  moduleNameMapper: {
    // SVG imported as React component via ?react Vite query
    '^(.+)\\.svg\\?react$': '<rootDir>/src/mocks/svg-component-mock.js',
    // SVG/PNG/etc imported as URL string
    '\\.(svg|png|jpg|jpeg|gif|ico|mp3|woff2?)$': '<rootDir>/src/mocks/svg-mock.js',
    // Mock modules/web3 to avoid wagmi (ESM-only) and SVG transitive imports
    '^modules/web3$': '<rootDir>/src/mocks/modules-web3-mock.js',
    '^modules/web3/(.*)$': '<rootDir>/src/mocks/modules-web3-mock.js',
  },
  // Don't transform node_modules — rely on their CJS builds
  transformIgnorePatterns: ['/node_modules/'],
};
