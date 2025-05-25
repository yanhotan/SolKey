// This file provides polyfills for node built-ins in browser environments
if (typeof window !== 'undefined') {
  // Global object polyfills
  window.global = window;
  global.Buffer = global.Buffer || require('buffer').Buffer;
  
  // Process polyfill
  if (!global.process) {
    global.process = require('process');
  }
  
  // Mock WebSocket native modules that are causing issues
  // These will be handled by the webpack config fallbacks
  global.bufferutil = global.bufferutil || {};
  global['utf-8-validate'] = global['utf-8-validate'] || {};
  
  // Add additional browser-specific polyfills for crypto
  if (!global.crypto) {
    global.crypto = window.crypto;
  }
}

// Export as ES module to allow importing
export {};
