import addExtension from './addExtension';
import attachScopes from './attachScopes';
import createFilter from './createFilter';
import dataToEsm from './dataToEsm';
import extractAssignedNames from './extractAssignedNames';
import makeLegalIdentifier from './makeLegalIdentifier';
import normalizePath from './normalizePath';
import { exactRegex, prefixRegex } from './filterUtils';

export {
  addExtension,
  attachScopes,
  createFilter,
  dataToEsm,
  exactRegex,
  extractAssignedNames,
  makeLegalIdentifier,
  normalizePath,
  prefixRegex
};

// TODO: remove this in next major
export default {
  addExtension,
  attachScopes,
  createFilter,
  dataToEsm,
  exactRegex,
  extractAssignedNames,
  makeLegalIdentifier,
  normalizePath,
  prefixRegex
};
