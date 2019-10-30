/* eslint-disable import/no-unresolved, import/extensions */

import fancyNumber from 'fancyNumber';

import moreNumbers from 'numberFolder/anotherNumber';

import nonAliased from './nonAliased';
import anotherFancyNumber from './anotherFancyNumber';
import anotherNumber from './numberFolder/anotherNumber';

export default fancyNumber + anotherFancyNumber + nonAliased + anotherNumber + moreNumbers;
