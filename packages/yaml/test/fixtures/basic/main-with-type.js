import config from './config.yaml' with { type: 'yaml' };

expect(config.answer).toBe(42);
