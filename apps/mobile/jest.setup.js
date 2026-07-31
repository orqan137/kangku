/* global jest */

jest.mock(
  '@react-native-async-storage/async-storage',
  () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: {CacheDir: '/tmp'},
      readFile: jest.fn(),
      writeFile: jest.fn(),
    },
  },
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
}));

jest.mock('react-native-pdf', () => ({
  __esModule: true,
  default: 'Pdf',
}));
