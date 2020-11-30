/*
 * This comment could be really important and should not be removed
 */

/* This comment does not matter */
const noSideEffect = null;

const externalExports = require('external-cjs-exports');

t.is(externalExports.foo, 'foo');
