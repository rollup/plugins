var crypto = (typeof global !== 'undefined' && global.crypto) || null;

function randomFill() { return 'randomFill'; }
function randomFillSync() { return 'randomFillSync'; }
function oldBrowser() { throw new Error('not supported'); }

if ((crypto && crypto.getRandomValues) || false) {
  exports.randomFill = randomFill;
  exports.randomFillSync = randomFillSync;
} else {
  exports.randomFill = oldBrowser;
  exports.randomFillSync = oldBrowser;
}
