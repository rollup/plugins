export function importModule(name) {
  return import(`./module-dir-c/${name}.js`);
}
