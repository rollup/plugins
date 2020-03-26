/* eslint-disable import/no-dynamic-require, global-require */

function takeModule (withName) {
	return require('./' + withName);
}

module.exports = takeModule('submodule.js');
