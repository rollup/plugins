global.null = 0;

// eslint-disable-next-line global-require
t.is(global.null && require('./error.js'), 0);
