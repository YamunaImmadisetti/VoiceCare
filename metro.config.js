const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  new RegExp('node_modules/react-native/node_modules/react-native/.*'),
];

module.exports = config;