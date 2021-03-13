export function NestedResolveTracker() {
  const nestedResolves = [];
  const inNestedResolve = ({ importee, importer }) =>
    nestedResolves.some(
      ({ importee: _importee, importer: _importer }) =>
        importee === _importee && importer === _importer
    );
  return {
    inNestedResolve,
    async track({ importee, importer }, callback) {
      const context = { importee, importer };
      nestedResolves.push(context);
      try {
        return await callback();
      } finally {
        nestedResolves.splice(nestedResolves.indexOf(context), 1);
      }
    }
  };
}
