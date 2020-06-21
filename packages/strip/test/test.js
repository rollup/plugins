const path = require('path');

const acorn = require('acorn');
const test = require('ava');

// eslint-disable-next-line import/no-unresolved
const strip = require('..');

const UNCHANGED = null;
const testFileName = 'virtual-test-case.js';

const stripped = (input, options) => {
  const virtualFilename = path.resolve(`test/fixtures/${testFileName}`);
  const result = strip(options).transform.call(
    {
      parse: (code) =>
        acorn.parse(code, {
          sourceType: 'module',
          ecmaVersion: 9
        })
    },
    input,
    virtualFilename
  );

  return result === null ? UNCHANGED : result.code;
};

// --------------- TESTS ---------------

test('can be configured to make no changes', (t) => {
  const input = `
  export default function foo() {
    before();
    debugger;
    logging:    
      console.log('a');
      console.error('b');
    after();
  }
  `;

  const options = {
    labels: [],
    functions: [],
    debugger: false
  };

  t.is(stripped(input, options), UNCHANGED);
});

test('excluded files do not get changed', (t) => {
  const input = `
  export default function foo() {
    before();
    debugger;
    logging:    
      console.log('a');
      console.error('b');
    after();
  }
  `;

  const options = {
    exclude: `**/${testFileName}`
  };

  t.is(stripped(input, options), UNCHANGED);
});

test('removes debugger statements by default', (t) => {
  const input = `
  export default function foo() {
    before();
    debugger;
    after();
  }
  `;

  const expected = `
  export default function foo() {
    before();
    after();
  }
  `;

  t.is(stripped(input), expected);
});

test('does not remove debugger statements with debugger: false', (t) => {
  const input = `
  export default function foo() {
    before();
    debugger;
    after();
  }
  `;

  const options = { debugger: false };

  t.is(stripped(input, options), UNCHANGED);
});

test('empty functions list leaves console statements', (t) => {
  const input = `
  foo(123);
  console.log('a');
  console.error('b');
  bar(789);
  `;

  const options = { functions: [] };

  t.is(stripped(input, options), UNCHANGED);
});

test('removes console statements by default', (t) => {
  const input = `
  foo(123);
  console.log('a');
  console.error('b');
  bar(789);
  `;

  const expected = `
  foo(123);
  bar(789);
  `;

  t.is(stripped(input), expected);
});

test('empty functions list leaves assert statements', (t) => {
  const input = `
  /* eslint-disable */
  function foo(message) {
    assert.equal(arguments.length, 1);
    assert.equal(typeof arguments[0], 'string');
    bar(message);
  }  
  `;

  const options = { functions: [] };

  t.is(stripped(input, options), UNCHANGED);
});

test('removes assert statements by default', (t) => {
  const input = `
  /* eslint-disable */
  function foo(message) {
    assert.equal(arguments.length, 1);
    assert.equal(typeof arguments[0], 'string');
    bar(message);
  }  
  `;

  const expected = `
  /* eslint-disable */
  function foo(message) {
    bar(message);
  }  
  `;

  t.is(stripped(input), expected);
});

test('leaves other console statements if custom functions are provided', (t) => {
  const input = `
  foo(123);
  console.log('a');
  console.error('b');
  bar(789);  
  `;

  const options = { functions: ['console.log'] };

  const expected = `
  foo(123);
  console.error('b');
  bar(789);  
  `;

  t.is(stripped(input, options), expected);
});

test('removes custom functions', (t) => {
  const input = `
  a();
  debug('hello');
  b();
  custom.foo('foo');
  custom.bar('bar');
  c();  
  `;

  const options = { functions: ['debug', 'custom.*'] };

  const expected = `
  a();
  b();
  c();  
  `;

  t.is(stripped(input, options), expected);
});

test('rewrites inline call expressions (not expression statements) as void 0', (t) => {
  const input = `DEBUG && console.log('debugging');`;
  const expected = `DEBUG && (void 0);`;

  t.is(stripped(input), expected);
});

test('rewrites inline if expessions as void 0', (t) => {
  const input = `if (DEBUG) console.log('debugging');`;
  const expected = `if (DEBUG) (void 0);`;

  t.is(stripped(input), expected);
});

test('rewrites expressions as void 0 in lambdas', (t) => {
  const input = `
  console.log(['h', 'e', 'y'].forEach((letter) => console.warn(letter)))
  `;

  const options = { functions: ['console.warn'] };

  const expected = `
  console.log(['h', 'e', 'y'].forEach((letter) => (void 0)))
  `;

  t.is(stripped(input, options), expected);
});

test('removes expressions in if blocks', (t) => {
  const input = `
  if (DEBUG) {
    console.log('debugging');
  }  
  `;

  const expected = `
  if (DEBUG) {
  }  
  `;

  t.is(stripped(input), expected);
});

test('removes methods of this', (t) => {
  const input = `
  a();
  this.foo('foo');
  this.bar('bar');
  b();  
  `;

  const options = { functions: ['this.*'] };

  const expected = `
  a();
  b();  
  `;

  t.is(stripped(input, options), expected);
});

test('removes super calls', (t) => {
  const input = `
  /* eslint-disable */
  class Foo {
    bar() {
      a();
      super.log('hello');
      b();
    }
  }  
  `;

  const options = { functions: ['super.log'] };

  const expected = `
  /* eslint-disable */
  class Foo {
    bar() {
      a();
      b();
    }
  }  
  `;

  t.is(stripped(input, options), expected);
});

test('replaces case body with void 0', (t) => {
  const input = `
  switch (a) {
    case 1:
      debugger;
  }  
  `;

  const expected = `
  switch (a) {
    case 1:
      (void 0);
  }  
  `;

  t.is(stripped(input), expected);
});

test('rewrites inline while expressions as void 0', (t) => {
  const input = `while (test()) console.log('still true!');`;
  const expected = `while (test()) (void 0);`;

  t.is(stripped(input), expected);
});

test('supports object destructuring assignments with default values', (t) => {
  const input = `
  export function fn({ foo = console.log(), bar } = {}) {
    const { baz = console.log() } = bar;
    console.log(foo, bar, baz);
  }  
  `;

  const expected = `
  export function fn({ foo = (void 0), bar } = {}) {
    const { baz = (void 0) } = bar;
  }  
  `;

  t.is(stripped(input), expected);
});

test('removes labeled blocks', (t) => {
  const input = `
  before();
  unittest: {
    test('some test', (assert) => {
      assert.true(true);
    });
  }
  after();
  `;

  const options = { labels: ['unittest'] };

  const expected = `
  before();
  after();
  `;

  t.is(stripped(input, options), expected);
});

test('removes multiple labeled blocks', (t) => {
  const input = `
  before();
  first: {
    things();
  }
  after();
  second: {
    assert.things();
  }
  again();  
  `;

  const options = { labels: ['first', 'second'] };

  const expected = `
  before();
  after();
  again();  
  `;

  t.is(stripped(input, options), expected);
});

test('only removes specified blocks', (t) => {
  const input = `
  before();
  first: {
    things();
  }
  after();
  second: {
    assert.things();
  }
  again();  
  `;

  const options = { labels: ['second'] };

  const expected = `
  before();
  first: {
    things();
  }
  after();
  again();  
  `;

  t.is(stripped(input, options), expected);
});

test('removes labeled blocks when filtered function is present', (t) => {
  const input = `
  before();
  unittest: {
    test('some test', (assert) => {
    });
  }
  after();
  `;

  const options = { labels: ['unittest'], functions: ['console.*'] };

  const expected = `
  before();
  after();
  `;

  t.is(stripped(input, options), expected);
});

test('removes labeled blocks when functions list is empty', (t) => {
  const input = `
  before();
  unittest: {
    test('some test', (assert) => {
    });
  }
  after();
  `;

  const options = { labels: ['unittest'], functions: [] };

  const expected = `
  before();
  after();
  `;

  t.is(stripped(input, options), expected);
});

test('whitespace between label and colon is accepted', (t) => {
  const input = `
  before();
  unittest  
  : {
    test('some test', (assert) => {
    });
  }
  after();
  `;

  const options = { labels: ['unittest'], functions: ['console.*'] };

  const expected = `
  before();
  after();
  `;

  t.is(stripped(input, options), expected);
});

test('removing a lable also works for expressions', (t) => {
  const input = `
  before();unittest:console.log();after();
  `;

  const options = { labels: ['unittest'] };

  const expected = `
  before();after();
  `;

  t.is(stripped(input, options), expected);
});

test('the same label can occur multiple times and all are removed', (t) => {
  const input = `
  before();
  unittest  
  : {
    test('some test', (assert) => {
    });
  }
  again();
  unittest:console.log();
  after();
  `;

  const options = { labels: ['unittest'], functions: ['console.*'] };

  const expected = `
  before();
  again();
  after();
  `;

  t.is(stripped(input, options), expected);
});

test('removes labeled even with awkward spacing', (t) => {
  const input = `
  before();
  unittest  
  : {
    test('some test', (assert) => {
    });
  }
  again();
  unittest:console.log();
  after();
  `;

  const options = { labels: ['unittest'], functions: ['console.*'] };

  const expected = `
  before();
  again();
  after();
  `;

  t.is(stripped(input, options), expected);
});

test('spaces around . in function calls are accepted', (t) => {
  const input = `
  before();
  function f() {
    return {
      g: function () {
        return {
          hello: function () {
            console.log('hello');
          }
        };
      }
    };
  }
    
  Test 
  .  
  f()
    .  g()  .
  hello();
  after();
  `;

  const options = { functions: ['Test.f', 'g', 'hello'] };

  const expected = `
  before();
  function f() {
    return {
      g: function () {
        return {
          hello: function () {
            console.log('hello');
          }
        };
      }
    };
  }
    
  (void 0)
    .  g()  .
  hello();
  after();
  `;

  t.is(stripped(input, options), expected);
});

test('function calls without . are replaced with (void 0)', (t) => {
  const input = `
  before();
  f() . g() . hello();
  after();
  `;

  const options = { functions: ['f', 'g', 'hello'] };

  const expected = `
  before();
  (void 0) . g() . hello();
  after();
  `;

  t.is(stripped(input, options), expected);
});
