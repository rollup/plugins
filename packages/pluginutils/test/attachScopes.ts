import * as estree from 'estree';

import test from 'ava';
import { parse } from 'acorn';

import { attachScopes, AttachedScope } from '../';

test('attaches a scope to the top level', (t) => {
  const ast = parse('var foo;', { ecmaVersion: 2020, sourceType: 'module' });

  const scope = attachScopes(ast, 'scope');
  t.truthy(scope.contains('foo'));
  t.falsy(scope.contains('bar'));
});

test('adds multiple declarators from a single var declaration', (t) => {
  const ast = parse('var foo, bar;', { ecmaVersion: 2020, sourceType: 'module' });

  const scope = attachScopes(ast, 'scope');
  t.truthy(scope.contains('foo'));
  t.truthy(scope.contains('bar'));
});

test('adds named declarators from a deconstructed declaration', (t) => {
  const ast = parse("var {1: a, b} = {1: 'a', b: 'b'};", {
    ecmaVersion: 2020,
    sourceType: 'module'
  });

  const scope = attachScopes(ast, 'scope');
  t.truthy(scope.contains('a'));
  t.truthy(scope.contains('b'));
});

test('adds rest elements from a deconstructed object declaration', (t) => {
  const ast = parse('const {x, y: z, ...rest} = {x: 10, y: 20, z: 30, w: 40, k: 50};', {
    ecmaVersion: 2020,
    sourceType: 'module'
  });

  const scope = attachScopes(ast, 'scope');
  t.truthy(scope.contains('x'));
  t.falsy(scope.contains('y'));
  t.truthy(scope.contains('z'));
  t.truthy(scope.contains('rest'));
});

test('adds nested declarators from a deconstructed declaration', (t) => {
  const ast = parse("let {a: {b: c}} = {a: {b: 'b'}};", {
    ecmaVersion: 2020,
    sourceType: 'module'
  });

  const scope = attachScopes(ast, 'scope');
  t.falsy(scope.contains('a'));
  t.falsy(scope.contains('b'));
  t.truthy(scope.contains('c'));
});

test('supports FunctionDeclarations without id', (t) => {
  const ast = parse('export default function () {}', { ecmaVersion: 2020, sourceType: 'module' });

  t.notThrows(() => {
    attachScopes(ast, 'scope');
  });
});

test('supports catch without a parameter', (t) => {
  const ast = parse('try {} catch {}', { ecmaVersion: 2020, sourceType: 'script' });

  t.notThrows(() => {
    attachScopes(ast, 'scope');
  });
});

test('supports ForStatement', (t) => {
  const ast = (parse(
    `
    for (let a = 0; a < 10; a++) {
      console.log(a);
      let b = 10;
    }
  `,
    { ecmaVersion: 2020, sourceType: 'module' }
  ) as unknown) as estree.Program;

  const scope = attachScopes(ast, 'scope');
  t.falsy(scope.contains('a'));
  t.falsy(scope.contains('b'));

  const forLoop = ast.body[0] as estree.ForStatement & { scope: AttachedScope };

  t.truthy(forLoop.scope.contains('a'));
  t.falsy(forLoop.scope.contains('b'));

  const forBody = forLoop.body as estree.BlockStatement & { scope: AttachedScope };
  t.truthy(forBody.scope.contains('a'));
  t.truthy(forBody.scope.contains('b'));
});

test('supports ForOfStatement', (t) => {
  const ast = (parse(
    `
    for (const a of [1, 2, 3]) {
      console.log(a);
      let b = 10;
    }
  `,
    { ecmaVersion: 2020, sourceType: 'module' }
  ) as unknown) as estree.Program;

  const scope = attachScopes(ast, 'scope');
  t.falsy(scope.contains('a'));
  t.falsy(scope.contains('b'));

  const forLoop = ast.body[0] as estree.ForOfStatement & { scope: AttachedScope };
  t.truthy(forLoop.scope.contains('a'));
  t.falsy(forLoop.scope.contains('b'));

  const forBody = forLoop.body as estree.BlockStatement & { scope: AttachedScope };
  t.truthy(forBody.scope.contains('a'));
  t.truthy(forBody.scope.contains('b'));
});

test('supports ForInStatement', (t) => {
  const ast = (parse(
    `
    for (let a in [1, 2, 3]) {
      console.log(a);
      let b = 10;
    }
  `,
    { ecmaVersion: 2020, sourceType: 'module' }
  ) as unknown) as estree.Program;

  const scope = attachScopes(ast, 'scope');
  t.falsy(scope.contains('a'));
  t.falsy(scope.contains('b'));

  const forLoop = ast.body[0] as estree.ForInStatement & { scope: AttachedScope };
  t.truthy(forLoop.scope.contains('a'));
  t.falsy(forLoop.scope.contains('b'));

  const forBody = forLoop.body as estree.BlockStatement & { scope: AttachedScope };
  t.truthy(forBody.scope.contains('a'));
  t.truthy(forBody.scope.contains('b'));
});
