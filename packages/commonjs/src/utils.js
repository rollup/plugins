/* eslint-disable import/prefer-default-export */
import { basename, dirname, extname, sep } from 'path';

import { makeLegalIdentifier } from '@rollup/pluginutils';

export function getName(id) {
  const name = makeLegalIdentifier(basename(id, extname(id)));
  if (name !== 'index') {
    return name;
  }
  const segments = dirname(id).split(sep);
  return makeLegalIdentifier(segments[segments.length - 1]);
}
