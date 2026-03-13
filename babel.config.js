module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxRuntime: 'automatic' }],
      '@babel/preset-typescript',
      '@babel/preset-react',
      ['@babel/preset-env', { targets: { node: 'current' } }],
    ],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      'react-native-reanimated/plugin',
    ],
  };
};

