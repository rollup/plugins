export function getIsCjsPromise(isCjsPromises, id) {
  let isCjsPromise = isCjsPromises.get(id);
  if (isCjsPromise) return isCjsPromise.promise;

  const promise = new Promise((resolve) => {
    isCjsPromise = {
      resolve,
      promise: null
    };
    isCjsPromises.set(id, isCjsPromise);
  });
  isCjsPromise.promise = promise;

  return promise;
}

export function setIsCjsPromise(isCjsPromises, id, resolution) {
  const isCjsPromise = isCjsPromises.get(id);
  if (isCjsPromise) {
    if (isCjsPromise.resolve) {
      isCjsPromise.resolve(resolution);
      isCjsPromise.resolve = null;
    }
  } else {
    isCjsPromises.set(id, { promise: Promise.resolve(resolution), resolve: null });
  }
}
