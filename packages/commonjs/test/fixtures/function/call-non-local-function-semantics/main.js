// simplified from dd-trace
const platform = require('./platform');
const browser = require('./browser');

platform.use(browser);

require('./proxy');
