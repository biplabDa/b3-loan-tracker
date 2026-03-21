const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  projectRoot: path.resolve(__dirname),
  watchFolders: [
    path.resolve(__dirname, 'node_modules'),
    // Add the parent directory if your project is nested
    path.resolve(__dirname, '../../'),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
