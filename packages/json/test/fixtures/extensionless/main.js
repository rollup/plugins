import config from './config';
import questions from './dir';

t.is(config.answer, 42);
t.is(questions['Are extensionless imports and /index resolutions a good idea?'], 'No.');
