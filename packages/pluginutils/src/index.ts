import addExtension from './addExtension';
import attachScopes from './attachScopes';
import createFilter from './createFilter';
import dataToEsm from './dataToEsm';
import extractAssignedNames from './extractAssignedNames';
import makeLegalIdentifier from './makeLegalIdentifier';

export {
  addExtension,
  attachScopes,
  createFilter,
  dataToEsm,
  extractAssignedNames,
  makeLegalIdentifier
};

// TODO: remove this in next major
export default {
  addExtension,
  attachScopes,
  createFilter,
  dataToEsm,
  extractAssignedNames,
  makeLegalIdentifier
};
