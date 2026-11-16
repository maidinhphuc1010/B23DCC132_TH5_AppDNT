module.exports = {
  preset: 'react-native',
  testTimeout: 20000,
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/@env.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|react-native-safe-area-context|react-native-screens|@react-native(-community)?|@react-native-async-storage|@react-navigation|firebase|@firebase)/)',
  ],
};
