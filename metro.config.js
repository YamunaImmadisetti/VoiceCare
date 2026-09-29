const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  // Works with both Windows (\\) and Unix (/) path separators
  /node_modules[\\/]react-native[\\/]node_modules[\\/]react-native[\\/].*/,
];

module.exports = config;