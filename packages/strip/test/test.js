const fs = require('fs');
const path = require('path');

const acorn = require('acorn');

const strip = require('..');

const compare = (fixture, options) => {
  const filename = path.resolve(`test/fixtures/${fixture}/input.js`);
  const input = fs.readFileSync(filename, 'utf-8');
  const output = strip(options).transform.call(
    {
      parse: (code) =>
        acorn.parse(code, {
          sourceType: 'module',
          ecmaVersion: 9
        })
    },
    input,
    filename
  );

  expect(output ? output.code : input).toMatchSnapshot();
};

test('can be configured to make no changes', () => {
  compare('no-changes', {
    labels: [],
    functions: [],
    debugger: false
  });
});

test('excluded files do not get changed', () => {
  compare('excluded-not-changed', { exclude: `**/excluded-not-changed/input.js` });
});

test('removes debugger statements', () => {
  compare('debugger');
});

test('does not remove debugger statements with debugger: false', () => {
  compare('debugger-false', { debugger: false });
});

test('empty functions list leaves console statements', () => {
  compare('no-changes', { functions: [] });
});

test('removes console statements', () => {
  compare('console');
});

test('removes assert statements', () => {
  compare('assert');
});

test('empty functions list leaves assert statements', () => {
  compare('assert', { functions: [] });
});

test('leaves console statements if custom functions are provided', () => {
  compare('console-custom', { functions: ['console.log'] });
});

test('removes custom functions', () => {
  compare('custom', { functions: ['debug', 'custom.*'] });
});

test('rewrtestes inline call expressions (not expression statements) as void 0', () => {
  compare('inline-call-expressions');
});

test('rewrtestes inline if expessions as void 0', () => {
  compare('inline-if');
});

test('rewrites expressions as void 0 in lambdas', () => {
  compare('lambda-void', { functions: ['console.warn'] });
});

test('removes expressions in if blocks', () => {
  compare('if-block');
});

test('removes methods of this', () => {
  compare('this-method', { functions: ['this.*'] });
});

test('removes super calls', () => {
  compare('super-method', { functions: ['super.log'] });
});

test('replaces case body with void 0', () => {
  compare('switch-case');
});

test('rewrtestes inline while expressions as void 0', () => {
  compare('inline-while');
});

test('supports object destructuring assignments with default values', () => {
  compare('object-destructuring-default');
});

test('removes labeled blocks', () => {
  compare('label-block', { labels: ['untesttest'] });
});

test('removes multiple labeled blocks', () => {
  compare('label-block-multiple', { labels: ['first', 'second'] });
});

test('only removes specified blocks', () => {
  compare('label-block-discriminate', { labels: ['second'] });
});

test('removes labeled blocks when filtered function is present', () => {
  compare('label-block', { labels: ['unittest'], functions: ['console.*'] });
});

test('removes labeled blocks when functions list is empty', () => {
  compare('label-block', { labels: ['unittest'], functions: [] });
});

test('whitespace between label and colon is accepted', () => {
  compare('label-whitespace', { labels: ['unittest'], functions: ['console.*'] });
});

test('removing a lable also works for expressions', () => {
  compare('label-expression', { labels: ['unittest'] });
});

test('the same label can occur multiple times and all are removed', () => {
  compare('label-multiple-times', { labels: ['unittest'] });
});

test('removes labeled even with awkward spacing', () => {
  compare('label-awkward-spacing', { labels: ['unittest'], functions: ['console.*'] });
});

test('spaces around . in function calls are accepted', () => {
  compare('functions-spaced', { labels: ['unittest'], functions: ['Test.f'] });
});

test('function calls without object are replaced with (void 0)', () => {
  compare('functions-direct', { labels: ['unittest'], functions: ['f'] });
});
