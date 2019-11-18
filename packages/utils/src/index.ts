import addExtension from './plugins/addExtension';
import attachScopes from './plugins/attachScopes';
import createFilter from './plugins/createFilter';
import dataToEsm from './plugins/dataToEsm';
import extractAssignedNames from './plugins/extractAssignedNames';
import makeLegalIdentifier from './plugins/makeLegalIdentifier';

const plugins = {
  addExtension,
  attachScopes,
  createFilter,
  dataToEsm,
  extractAssignedNames,
  makeLegalIdentifier
};

export default plugins;
