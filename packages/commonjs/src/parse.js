import acornLoose from 'acorn-loose';

export function tryParse(parse, code, id) {
  try {
    return parse(code, { allowReturnOutsideFunction: true });
  } catch (err) {
    try {
      return acornLoose.parse(code, { allowReturnOutsideFunction: true, ecmaVersion: 2020 });
    } catch (err2) {
      // We ignore this second try and just report the original error
    }

    err.message += ` in ${id}`;
    throw err;
  }
}

const firstpassGlobal = /\b(?:require|module|exports|global)\b/;

const firstpassNoGlobal = /\b(?:require|module|exports)\b/;

export function hasCjsKeywords(code, ignoreGlobal) {
  const firstpass = ignoreGlobal ? firstpassNoGlobal : firstpassGlobal;
  return firstpass.test(code);
}
