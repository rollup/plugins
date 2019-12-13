/* eslint-disable */
// From https://github.com/rollup/rollup-plugin-commonjs/issues/38
(function(global, factory) {
  /* AMD */ if (typeof define === 'function' && define.amd) define(['foo'], factory);
  /* CommonJS */ else if (
    typeof require === 'function' &&
    typeof module === 'object' &&
    module &&
    module.exports
  )
    module.exports = factory(require('foo'), true);
  /* Global */ else
    (global.dcodeIO = global.dcodeIO || {}).ProtoBuf = factory(global.dcodeIO.ByteBuffer);
})(this, (ByteBuffer, isCommonJS) => isCommonJS);
