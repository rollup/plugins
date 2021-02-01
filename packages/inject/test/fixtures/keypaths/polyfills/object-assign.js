export default Object.assign ||
  function (target, ...sources) {
    sources.forEach((source) => {
      Object.keys(source).forEach((key) => (target[key] = source[key]));
    });

    return target;
  };
