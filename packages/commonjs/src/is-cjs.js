const commonJSMetaPromises = new Map();

export function getCommonJSMetaPromise(id) {
  let commonJSMetaPromise = commonJSMetaPromises.get(id);
  if (commonJSMetaPromise) return commonJSMetaPromise.promise;

  const promise = new Promise((resolve) => {
    commonJSMetaPromise = {
      resolve,
      promise: null
    };
    commonJSMetaPromises.set(id, commonJSMetaPromise);
  });
  commonJSMetaPromise.promise = promise;

  return promise;
}

export function setCommonJSMetaPromise(id, commonjsMeta) {
  const commonJSMetaPromise = commonJSMetaPromises.get(id);
  if (commonJSMetaPromise) {
    if (commonJSMetaPromise.resolve) {
      commonJSMetaPromise.resolve(commonjsMeta);
      commonJSMetaPromise.resolve = null;
    }
  } else {
    commonJSMetaPromises.set(id, { promise: Promise.resolve(commonjsMeta), resolve: null });
  }
}
