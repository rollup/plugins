/* eslint-disable import/no-unresolved, import/extensions */

import config from './config';
import questions from './dir';

expect(config.answer).toBe(42);
expect(questions['Are extensionless imports and /index resolutions a good idea?']).toBe('No.');
