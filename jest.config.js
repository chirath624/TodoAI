const transformPackages = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  'react-native-mmkv',
  'react-native-nitro-modules',
  'react-native-screens',
  'react-native-safe-area-context',
  '@react-navigation',
  '@shopify/flash-list',
  '@d11/react-native-fast-image',
  '@reduxjs',
  'react-redux',
  'redux',
  'immer',
  'reselect',
  'redux-thunk',
];

module.exports = {
  preset: '@react-native/jest-preset',
  // Also transform packages that ship ESM-only or untranspiled builds.
  transformIgnorePatterns: [
    `node_modules/(?!(${transformPackages.join('|')})/)`,
  ],
  setupFiles: [
    '<rootDir>/jest.setup.js',
    '@shopify/flash-list/jestSetup',
  ],
};
