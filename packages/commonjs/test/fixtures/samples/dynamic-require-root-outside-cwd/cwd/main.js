function takeModule(path) {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  return require(path);
}

takeModule('../outer.js');
