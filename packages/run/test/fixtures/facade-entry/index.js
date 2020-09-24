import log from './library';

log(0);
(async () => {
  await import('./dynamic');
})();
