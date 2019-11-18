import {parse} from 'url';

var ourUrl = 'https://💩.gov/baz/bat?a=b#lalalallala';
var parsed = parse(ourUrl);

if (
  parsed.hash !== '#lalalallala' ||
  parsed.query !== 'a=b' ||
  parsed.host !== 'xn--ls8h.gov'
) {
  done(new Error('invalid object'));
} else {
  done();
}
