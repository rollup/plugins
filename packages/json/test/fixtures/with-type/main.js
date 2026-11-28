import config from './config.json' with { type: 'json' };

t.is(config.answer, 42);
