const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite na web usa WebAssembly (wa-sqlite): habilita .wasm como asset.
config.resolver.assetExts.push('wasm');

// Headers exigidos pelo SharedArrayBuffer (usado pelo wa-sqlite na web).
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  };
};

module.exports = config;
