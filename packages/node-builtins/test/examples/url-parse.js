import { parse } from 'url';

const ourUrl = 'https://💩.gov/baz/bat?a=b#lalalallala';
const parsed = parse(ourUrl);

if (parsed.hash !== '#lalalallala' || parsed.query !== 'a=b' || parsed.host !== 'xn--ls8h.gov') {
  done(new Error('invalid object'));
} else {
  done();
}
