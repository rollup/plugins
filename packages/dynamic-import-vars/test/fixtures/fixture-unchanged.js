import './module-dir-a/module-a-1';

export function importModuleA() {
  return import(`./module-dir-a/module-a-2.js`);
}

export function importModuleB() {
  return import('./' + 'module-dir-a' + '/' + 'module-a-2' + '.js');
}
