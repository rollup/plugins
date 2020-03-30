/* eslint-disable import/no-dynamic-require, global-require */

function takeModule(withName) {
	return require('./' + withName);
}

const withExtension = takeModule('submodule.js');
const withoutExtension = takeModule('submodule');

t.is(withExtension.name, 'submodule');
t.is(withoutExtension.name, 'submodule');

withExtension.value = 'mutated';

t.is(withoutExtension.value, 'mutated');
