import {EventEmitter as EE} from 'events';

var e = new EE();
e.on('it', function (foo) {
  done();
});
e.emit('it', 'works');
