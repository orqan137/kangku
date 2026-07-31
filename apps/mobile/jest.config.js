module.exports = {
  preset: 'react-native',
  setupFiles: [
    '<rootDir>/node_modules/@react-native-documents/picker/jest/build/jest/setup.js',
    '<rootDir>/jest.setup.js',
  ],
  moduleNameMapper: {
    '^@react-native-documents/picker$':
      '<rootDir>/node_modules/@react-native-documents/picker/jest/build/src/index.js',
  },
};
