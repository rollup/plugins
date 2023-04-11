const { value: initialValue, reassign } = require('./dep');

t.is(initialValue, 'initial');
reassign('new');
t.is(require('./dep'), 'new');
