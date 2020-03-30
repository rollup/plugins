/* eslint-disable import/no-dynamic-require, global-require */

function takeModule(withName) {
	return require('./' + withName);
}

t.deepEqual(takeModule('dynamic.json'), {value: 'present'});
t.deepEqual(takeModule('dynamic'), {value: 'present'});
