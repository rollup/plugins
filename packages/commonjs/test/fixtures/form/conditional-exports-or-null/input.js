var crypto = (typeof global !== 'undefined' && global.crypto) || null;

function secureHandler() { return 'secure'; }
function fallbackHandler() { return 'fallback'; }

if ((crypto && crypto.getRandomValues) || null) {
  exports.handler = secureHandler;
} else {
  exports.handler = fallbackHandler;
}
