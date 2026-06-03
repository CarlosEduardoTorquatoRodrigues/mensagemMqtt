module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-expo|@react-native|@react-navigation|expo|react-native|react-native-web|@expo|expo-modules-core|expo-sqlite|mqtt)/)'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
