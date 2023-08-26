import { constants } from 'node:crypto';

import MagicString from 'magic-string';

const child = require('child');

const s = new MagicString('');
const c = constants.SEP;

export { child, s, c };
