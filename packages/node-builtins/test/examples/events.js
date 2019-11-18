import { EventEmitter as EE } from 'events';

const e = new EE();
e.on('it', (foo) => {
  done();
});
e.emit('it', 'works');
