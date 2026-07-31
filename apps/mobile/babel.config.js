module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-transform-optional-chaining', {loose: true}],
    ['@babel/plugin-transform-nullish-coalescing-operator', {loose: true}],
  ],
};
