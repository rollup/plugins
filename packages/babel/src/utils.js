export const addBabelPlugin = (options, plugin) => {
  return {
    ...options,
    plugins: options.plugins.concat(plugin)
  };
};

const warned = {};
export function warnOnce(ctx, msg) {
  if (warned[msg]) return;
  warned[msg] = true;
  ctx.warn(msg);
}

const regExpCharactersRegExp = /[\\^$.*+?()[\]{}|]/g;
export const escapeRegExpCharacters = (str) => str.replace(regExpCharactersRegExp, '\\$&');

export function stripQuery(id) {
  // strip query params from import
  const [bareId, query] = id.split('?');
  const suffix = `${query ? `?${query}` : ''}`;
  return {
    bareId,
    query,
    suffix
  };
}
