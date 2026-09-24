/* eslint-env jest */
// react-native-mmkv returns an in-memory mock under Jest, but still imports
// Nitro at module load, which throws without the native module.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: jest.fn(() => {
      throw new Error('Nitro HybridObjects are unavailable under Jest');
    }),
  },
}));

jest.mock('@d11/react-native-fast-image', () => {
  const { View } = require('react-native');
  const FastImage = props => <View testID="fast-image" {...props} />;
  FastImage.priority = { low: 'low', normal: 'normal', high: 'high' };
  FastImage.preload = jest.fn();
  return { __esModule: true, default: FastImage };
});

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(() => Promise.resolve({ didCancel: true })),
  launchImageLibrary: jest.fn(() => Promise.resolve({ didCancel: true })),
}));

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/docs',
  mkdir: jest.fn(() => Promise.resolve()),
  copyFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
}));
