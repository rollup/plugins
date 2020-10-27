/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */

// ? should be treated as special symbol for query params
export { default as WithQuery } from './moduleQuery?q=asd';
// # should be treated as normal filename character
export { default as WithHash } from './module#Hash';

// So, this is an import with path "./moduleQueryAnd#Hash" and query "?q=asd#hash"
export { default as WithQueryAndHash } from './moduleQueryAnd#Hash?q=asd#hash';
