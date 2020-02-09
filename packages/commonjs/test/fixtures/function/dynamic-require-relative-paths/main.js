/* eslint-disable import/no-dynamic-require, global-require */

function takeModuleWithDelimiter(name, delimiter) {
	return require('.' + delimiter + name.replace(/=/g, delimiter));
}

t.is(takeModuleWithDelimiter('sub=submodule.js', '/'), 'submodule');
t.is(takeModuleWithDelimiter('sub=subsub=subsubmodule.js', '/'), 'subsubmodule');
t.is(takeModuleWithDelimiter('sub=submodule.js', '\\'), 'submodule');
t.is(takeModuleWithDelimiter('sub=subsub=subsubmodule.js', '\\'), 'subsubmodule');
