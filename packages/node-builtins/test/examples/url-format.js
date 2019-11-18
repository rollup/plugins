import {format} from 'url';

var created = format({
  protocol: 'foo',
  host: 'bar',
  pathname: '/baz'
});

if (created !== 'foo:bar/baz') {
  done(new Error('wrong output'));
} else {
  done();
}
