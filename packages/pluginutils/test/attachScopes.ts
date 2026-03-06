import type * as estree from 'estree';

import { parse } from 'acorn';

import type { AttachedScope } from '../';
import { attachScopes } from '../';

test('attaches a scope to the top level', () => {
  const ast = parse('var foo;', { ecmaVersion: 2020, sourceType: 'module' });

  const scope = attachScopes(ast, 'scope');
  expect(scope.contains('foo')).toBeTruthy();
  expect(scope.contains('bar')).toBeFalsy();
});

test('adds multiple declarators from a single var declaration', () => {
  const ast = parse('var foo, bar;', { ecmaVersion: 2020, sourceType: 'module' });

  const scope = attachScopes(ast, 'scope');
  expect(scope.contains('foo')).toBeTruthy();
  expect(scope.contains('bar')).toBeTruthy();
});

test('adds named declarators from a deconstructed declaration', () => {
  const ast = parse("var {1: a, b} = {1: 'a', b: 'b'};", {
    ecmaVersion: 2020,
    sourceType: 'module'
  });

  const scope = attachScopes(ast, 'scope');
  expect(scope.contains('a')).toBeTruthy();
  expect(scope.contains('b')).toBeTruthy();
});

test('adds rest elements from a deconstructed object declaration', () => {
  const ast = parse('const {x, y: z, ...rest} = {x: 10, y: 20, z: 30, w: 40, k: 50};', {
    ecmaVersion: 2020,
    sourceType: 'module'
  });

  const scope = attachScopes(ast, 'scope');
  expect(scope.contains('x')).toBeTruthy();
  expect(scope.contains('y')).toBeFalsy();
  expect(scope.contains('z')).toBeTruthy();
  expect(scope.contains('rest')).toBeTruthy();
});

test('adds nested declarators from a deconstructed declaration', () => {
  const ast = parse("let {a: {b: c}} = {a: {b: 'b'}};", {
    ecmaVersion: 2020,
    sourceType: 'module'
  });

  const scope = attachScopes(ast, 'scope');
  expect(scope.contains('a')).toBeFalsy();
  expect(scope.contains('b')).toBeFalsy();
  expect(scope.contains('c')).toBeTruthy();
});

test('supports FunctionDeclarations without id', () => {
  const ast = parse('export default function () {}', { ecmaVersion: 2020, sourceType: 'module' });

  expect(() => {
    attachScopes(ast, 'scope');
  }).not.toThrow();
});

test('supports catch without a parameter', () => {
  const ast = parse('try {} catch {}', { ecmaVersion: 2020, sourceType: 'script' });

  expect(() => {
    attachScopes(ast, 'scope');
  }).not.toThrow();
});

test('supports ForStatement', () => {
  const ast = parse(
    `
    for (let a = 0; a < 10; a++) {
      console.log(a);
      let b = 10;
    }
  `,
    { ecmaVersion: 2020, sourceType: 'module' }
  ) as unknown as estree.Program;

  const scope = attachScopes(ast, 'scope');
  expect(scope.contains('a')).toBeFalsy();
  expect(scope.contains('b')).toBeFalsy();

  const forLoop = ast.body[0] as estree.ForStatement & { scope: AttachedScope };

  expect(forLoop.scope.contains('a')).toBeTruthy();
  expect(forLoop.scope.contains('b')).toBeFalsy();

  const forBody = forLoop.body as estree.BlockStatement & { scope: AttachedScope };
  expect(forBody.scope.contains('a')).toBeTruthy();
  expect(forBody.scope.contains('b')).toBeTruthy();
});

test('supports ForOfStatement', () => {
  const ast = parse(
    `
    for (const a of [1, 2, 3]) {
      console.log(a);
      let b = 10;
    }
  `,
    { ecmaVersion: 2020, sourceType: 'module' }
  ) as unknown as estree.Program;

  const scope = attachScopes(ast, 'scope');
  expect(scope.contains('a')).toBeFalsy();
  expect(scope.contains('b')).toBeFalsy();

  const forLoop = ast.body[0] as estree.ForOfStatement & { scope: AttachedScope };
  expect(forLoop.scope.contains('a')).toBeTruthy();
  expect(forLoop.scope.contains('b')).toBeFalsy();

  const forBody = forLoop.body as estree.BlockStatement & { scope: AttachedScope };
  expect(forBody.scope.contains('a')).toBeTruthy();
  expect(forBody.scope.contains('b')).toBeTruthy();
});

test('supports ForInStatement', () => {
  const ast = parse(
    `
    for (let a in [1, 2, 3]) {
      console.log(a);
      let b = 10;
    }
  `,
    { ecmaVersion: 2020, sourceType: 'module' }
  ) as unknown as estree.Program;

  const scope = attachScopes(ast, 'scope');
  expect(scope.contains('a')).toBeFalsy();
  expect(scope.contains('b')).toBeFalsy();

  const forLoop = ast.body[0] as estree.ForInStatement & { scope: AttachedScope };
  expect(forLoop.scope.contains('a')).toBeTruthy();
  expect(forLoop.scope.contains('b')).toBeFalsy();

  const forBody = forLoop.body as estree.BlockStatement & { scope: AttachedScope };
  expect(forBody.scope.contains('a')).toBeTruthy();
  expect(forBody.scope.contains('b')).toBeTruthy();
});
