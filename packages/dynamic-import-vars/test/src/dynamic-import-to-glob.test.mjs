/* eslint-disable import/extensions, import/no-unresolved, no-template-curly-in-string */

import { parse } from 'acorn';
import { test, expect } from 'vitest';

import { dynamicImportToGlob, VariableDynamicImportError } from 'current-package';

test('template literal with variable filename', () => {
  const ast = parse('import(`./foo/${bar}.js`);', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./foo/*.js');
});
test('external', () => {
  const ast = parse('import(`https://some.cdn.com/package/${version}/index.js`);', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe(null);
});
test('external - leaves bare module specifiers starting with https in tact', () => {
  const ast = parse('import("http_utils");', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe(null);
});
test('data uri', () => {
  const ast = parse('import(`data:${bar}`);', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe(null);
});
test('template literal with dot-prefixed suffix', () => {
  const ast = parse('import(`./${bar}.entry.js`);', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./*.entry.js');
});
test('template literal with variable directory', () => {
  const ast = parse('import(`./foo/${bar}/x.js`);', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./foo/*/x.js');
});
test('template literal with multiple variables', () => {
  const ast = parse('import(`./${foo}/${bar}.js`);', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./*/*.js');
});
test('dynamic expression with variable filename', () => {
  const ast = parse('import("./foo/".concat(bar,".js"));', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./foo/*.js');
});
test('dynamic expression with variable directory', () => {
  const ast = parse('import("./foo/".concat(bar, "/x.js"));', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./foo/*/x.js');
});
test('dynamic expression with multiple variables', () => {
  const ast = parse('import("./".concat(foo, "/").concat(bar,".js"));', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./*/*.js');
});
test('string concatenation', () => {
  const ast = parse('import("./foo/" + bar + ".js");', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./foo/*.js');
});
test('string concatenation and template literals combined', () => {
  const ast = parse('import("./" + `foo/${bar}` + ".js");', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./foo/*.js');
});
test('string literal in a template literal expression', () => {
  const ast = parse('import(`${"./foo/"}${bar}.js`);', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./foo/*.js');
});
test('multiple variables are collapsed into a single *', () => {
  const ast = parse('import(`./foo/${bar}${baz}/${x}${y}.js`);', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./foo/*/*.js');
});
test('throws when dynamic import contains a *', () => {
  const ast = parse('import(`./*${foo}.js`);', {
    sourceType: 'module'
  });
  let error;
  try {
    dynamicImportToGlob(ast.body[0].expression.source);
  } catch (e) {
    error = e;
  }
  expect(error.message).toBe('A dynamic import cannot contain * characters.');
  expect(error instanceof VariableDynamicImportError).toBe(true);
});
test('throws when dynamic import contains a non + operator', () => {
  const ast = parse('import("foo" - "bar.js");', {
    sourceType: 'module'
  });
  let error;
  try {
    dynamicImportToGlob(ast.body[0].expression.source);
  } catch (e) {
    error = e;
  }
  expect(error.message).toBe('- operator is not supported.');
  expect(error instanceof VariableDynamicImportError).toBe(true);
});
test('throws when dynamic import is a single variable', () => {
  const ast = parse('import(foo);', {
    sourceType: 'module'
  });
  let error;
  try {
    dynamicImportToGlob(ast.body[0].expression.source, '${sourceString}');
  } catch (e) {
    error = e;
  }
  expect(error.message).toBe(
    'invalid import "${sourceString}". It cannot be statically analyzed. Variable dynamic imports must start with ./ and be limited to a specific directory. For example: import(`./foo/${bar}.js`).'
  );
  expect(error instanceof VariableDynamicImportError).toBe(true);
});
test('throws when dynamic import starts with a variable', () => {
  const ast = parse('import(`${folder}/foo.js`);', {
    sourceType: 'module'
  });
  let error;
  try {
    dynamicImportToGlob(ast.body[0].expression.source, '${sourceString}');
  } catch (e) {
    error = e;
  }
  expect(error.message).toBe(
    'invalid import "${sourceString}". It cannot be statically analyzed. Variable dynamic imports must start with ./ and be limited to a specific directory. For example: import(`./foo/${bar}.js`).'
  );
  expect(error instanceof VariableDynamicImportError).toBe(true);
});
test('throws when dynamic import starts with a /', () => {
  const ast = parse('import(`/foo/${bar}.js`);', {
    sourceType: 'module'
  });
  let error;
  try {
    dynamicImportToGlob(ast.body[0].expression.source, '${sourceString}');
  } catch (e) {
    error = e;
  }
  expect(error.message).toBe(
    'invalid import "${sourceString}". Variable absolute imports are not supported, imports must start with ./ in the static part of the import. For example: import(`./foo/${bar}.js`).'
  );
  expect(error instanceof VariableDynamicImportError).toBe(true);
});
test('throws when dynamic import does not start with ./', () => {
  const ast = parse('import(`foo/${bar}.js`);', {
    sourceType: 'module'
  });
  let error;
  try {
    dynamicImportToGlob(ast.body[0].expression.source, '${sourceString}');
  } catch (e) {
    error = e;
  }
  expect(error.message).toBe(
    'invalid import "${sourceString}". Variable bare imports are not supported, imports must start with ./ in the static part of the import. For example: import(`./foo/${bar}.js`).'
  );
  expect(error instanceof VariableDynamicImportError).toBe(true);
});
test("throws when dynamic import imports it's own directory", () => {
  const ast = parse('import(`./${foo}.js`);', {
    sourceType: 'module'
  });
  let error;
  try {
    dynamicImportToGlob(ast.body[0].expression.source, '${sourceString}');
  } catch (e) {
    error = e;
  }
  expect(error.message).toBe(
    'invalid import "${sourceString}". Variable imports cannot import their own directory, place imports in a separate directory or make the import filename more specific. For example: import(`./foo/${bar}.js`).'
  );
  expect(error instanceof VariableDynamicImportError).toBe(true);
});
test('throws when dynamic import imports does not contain a file extension', () => {
  const ast = parse('import(`./foo/${bar}`);', {
    sourceType: 'module'
  });
  let error;
  try {
    dynamicImportToGlob(ast.body[0].expression.source, '${sourceString}');
  } catch (e) {
    error = e;
  }
  expect(error.message).toBe(
    'invalid import "${sourceString}". A file extension must be included in the static part of the import. For example: import(`./foo/${bar}.js`).'
  );
  expect(error instanceof VariableDynamicImportError).toBe(true);
});
test('escapes ()', () => {
  const ast = parse('import(`./${foo}/(foo).js`);', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./*/\\(foo\\).js');
});
test('escapes []', () => {
  const ast = parse('import(`./${foo}/[foo].js`);', {
    sourceType: 'module'
  });
  const glob = dynamicImportToGlob(ast.body[0].expression.source);
  expect(glob).toBe('./*/\\[foo\\].js');
});
