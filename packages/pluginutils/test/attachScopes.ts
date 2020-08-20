import test from 'ava';
import { parse } from 'acorn';

import { attachScopes } from '../';

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
