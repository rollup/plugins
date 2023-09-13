/*
 * This comment could be really important and should not be removed
 */

/* This comment does not matter */
const noSideEffect = null;

modifyExports(exports);

function modifyExports(exported) {
  // eslint-disable-next-line no-param-reassign
  exported.foo = 'bar';
}
