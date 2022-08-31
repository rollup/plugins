/* eslint-disable import/extensions, import/no-unresolved, no-template-curly-in-string */

import { Parser } from 'acorn';
import dynamicImport from 'acorn-dynamic-import';
import test from 'ava';

import { dynamicImportToGlob, VariableDynamicImportError } from '../../dist/index';

const CustomParser = Parser.extend(dynamicImport);

const mockRollup = {
  resolve(id) {
    return { id };
  }
};

const mockRollupNotResolving = {
  resolve() {
    return null;
  }
};

test('template literal with variable filename', async (t) => {
  const ast = CustomParser.parse('import(`./foo/${bar}.js`);', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '',
    null,
    mockRollup
  );
  t.is(glob, './foo/*.js');
});

test('external', async (t) => {
  const ast = CustomParser.parse('import(`https://some.cdn.com/package/${version}/index.js`);', {
    sourceType: 'module'
  });

  const glob = await dynamicImportToGlob(ast.body[0].expression.arguments[0], '', null, mockRollup);
  t.is(glob, null);
});

test('external - leaves bare module specifiers starting with https in tact', async (t) => {
  const ast = CustomParser.parse('import("http_utils");', {
    sourceType: 'module'
  });

  const glob = await dynamicImportToGlob(ast.body[0].expression.arguments[0], '', null, mockRollup);
  t.is(glob, null);
});

test('data uri', async (t) => {
  const ast = CustomParser.parse('import(`data:${bar}`);', {
    sourceType: 'module'
  });

  const glob = await dynamicImportToGlob(ast.body[0].expression.arguments[0], '', null, mockRollup);
  t.is(glob, null);
});

test('template literal with dot-prefixed suffix', async (t) => {
  const ast = CustomParser.parse('import(`./${bar}.entry.js`);', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '',
    null,
    mockRollup
  );
  t.is(glob, './*.entry.js');
});

test('template literal with variable directory', async (t) => {
  const ast = CustomParser.parse('import(`./foo/${bar}/x.js`);', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '',
    null,
    mockRollup
  );
  t.is(glob, './foo/*/x.js');
});

test('template literal with multiple variables', async (t) => {
  const ast = CustomParser.parse('import(`./${foo}/${bar}.js`);', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '',
    null,
    mockRollup
  );
  t.is(glob, './*/*.js');
});

test('dynamic expression with variable filename', async (t) => {
  const ast = CustomParser.parse('import("./foo/".concat(bar,".js"));', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '',
    null,
    mockRollup
  );
  t.is(glob, './foo/*.js');
});

test('dynamic expression with variable directory', async (t) => {
  const ast = CustomParser.parse('import("./foo/".concat(bar, "/x.js"));', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '',
    null,
    mockRollup
  );
  t.is(glob, './foo/*/x.js');
});

test('dynamic expression with multiple variables', async (t) => {
  const ast = CustomParser.parse('import("./".concat(foo, "/").concat(bar,".js"));', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '',
    null,
    mockRollup
  );
  t.is(glob, './*/*.js');
});

test('string concatenation', async (t) => {
  const ast = CustomParser.parse('import("./foo/" + bar + ".js");', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '',
    null,
    mockRollup
  );
  t.is(glob, './foo/*.js');
});

test('string concatenation and template literals combined', async (t) => {
  const ast = CustomParser.parse('import("./" + `foo/${bar}` + ".js");', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '',
    null,
    mockRollup
  );
  t.is(glob, './foo/*.js');
});

test('string literal in a template literal expression', async (t) => {
  const ast = CustomParser.parse('import(`${"./foo/"}${bar}.js`);', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '',
    null,
    mockRollup
  );
  t.is(glob, './foo/*.js');
});

test('multiple variables are collapsed into a single *', async (t) => {
  const ast = CustomParser.parse('import(`./foo/${bar}${baz}/${x}${y}.js`);', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '',
    null,
    mockRollup
  );
  t.is(glob, './foo/*/*.js');
});

test('throws when dynamic import contains a *', async (t) => {
  const ast = CustomParser.parse('import(`./*${foo}.js`);', {
    sourceType: 'module'
  });

  let error;
  try {
    await dynamicImportToGlob(ast.body[0].expression.arguments[0], '', null, mockRollup);
  } catch (e) {
    error = e;
  }
  t.is(error.message, 'A dynamic import cannot contain * characters.');
  t.true(error instanceof VariableDynamicImportError);
});

test('throws when dynamic import contains a non + operator', async (t) => {
  const ast = CustomParser.parse('import("foo" - "bar.js");', {
    sourceType: 'module'
  });

  let error;
  try {
    await dynamicImportToGlob(ast.body[0].expression.arguments[0], '', null, mockRollup);
  } catch (e) {
    error = e;
  }
  t.is(error.message, '- operator is not supported.');
  t.true(error instanceof VariableDynamicImportError);
});

test('throws when dynamic import is a single variable', async (t) => {
  const ast = CustomParser.parse('import(foo);', {
    sourceType: 'module'
  });

  let error;
  try {
    await dynamicImportToGlob(
      ast.body[0].expression.arguments[0],
      '${sourceString}',
      __filename,
      mockRollup
    );
  } catch (e) {
    error = e;
  }
  t.is(
    error.message,
    'invalid import "${sourceString}". It cannot be statically analyzed. Variable dynamic imports must start with ./ and be limited to a specific directory. For example: import(`./foo/${bar}.js`).'
  );
  t.true(error instanceof VariableDynamicImportError);
});

test('throws when dynamic import starts with a variable', async (t) => {
  const ast = CustomParser.parse('import(`${folder}/foo.js`);', {
    sourceType: 'module'
  });

  let error;
  try {
    await dynamicImportToGlob(
      ast.body[0].expression.arguments[0],
      '${sourceString}',
      __filename,
      mockRollup
    );
  } catch (e) {
    error = e;
  }
  t.is(
    error.message,
    'invalid import "${sourceString}". It cannot be statically analyzed. Variable dynamic imports must start with ./ and be limited to a specific directory. For example: import(`./foo/${bar}.js`).'
  );
  t.true(error instanceof VariableDynamicImportError);
});

test('throws when dynamic import starts with a /', async (t) => {
  const ast = CustomParser.parse('import(`/foo/${bar}.js`);', {
    sourceType: 'module'
  });

  let error;
  try {
    await dynamicImportToGlob(
      ast.body[0].expression.arguments[0],
      '${sourceString}',
      __filename,
      mockRollup
    );
  } catch (e) {
    error = e;
  }
  t.is(
    error.message,
    'invalid import "${sourceString}". Variable absolute imports are not supported, imports must start with ./ in the static part of the import. For example: import(`./foo/${bar}.js`).'
  );
  t.true(error instanceof VariableDynamicImportError);
});

test('does not throw when dynamic import does not start with ./', async (t) => {
  const ast = CustomParser.parse('import(`@rollup/plugin-dynamic-import-vars/src/${bar}.js`);', {
    sourceType: 'module'
  });

  const { glob } = await dynamicImportToGlob(
    ast.body[0].expression.arguments[0],
    '${sourceString}',
    __filename,
    mockRollup
  );
  t.is(glob, '../../@rollup/plugin-dynamic-import-vars/src/*.js');
});

test('throws when dynamic import does not start with ./ and not an npm package name', async (t) => {
  const ast = CustomParser.parse('import(`$foo/${bar}.js`);', {
    sourceType: 'module'
  });

  let error;
  try {
    await dynamicImportToGlob(
      ast.body[0].expression.arguments[0],
      '${sourceString}',
      __filename,
      mockRollupNotResolving
    );
  } catch (e) {
    error = e;
  }
  t.is(
    error.message,
    'invalid import "${sourceString}". Non-relative variable imports that do not match an NPM package name are not supported, imports must start with either an npm package name or ./ in the static part of the import. For example: import(`./foo/${bar}.js`).'
  );
  t.true(error instanceof VariableDynamicImportError);
});

test('throws when dynamic import does not start with ./ and can not be resolved', async (t) => {
  const ast = CustomParser.parse('import(`foo/${bar}.js`);', {
    sourceType: 'module'
  });

  let error;
  try {
    await dynamicImportToGlob(
      ast.body[0].expression.arguments[0],
      '${sourceString}',
      __filename,
      mockRollupNotResolving
    );
  } catch (e) {
    error = e;
  }
  t.is(error.message, 'invalid import "${sourceString}". Could not resolve module "foo".');
  t.true(error instanceof VariableDynamicImportError);
});

test("throws when dynamic import imports it's own directory", async (t) => {
  const ast = CustomParser.parse('import(`./${foo}.js`);', {
    sourceType: 'module'
  });

  let error;
  try {
    await dynamicImportToGlob(
      ast.body[0].expression.arguments[0],
      '${sourceString}',
      __filename,
      mockRollup
    );
  } catch (e) {
    error = e;
  }
  t.is(
    error.message,
    'invalid import "${sourceString}". Variable imports cannot import their own directory, place imports in a separate directory or make the import filename more specific. For example: import(`./foo/${bar}.js`).'
  );
  t.true(error instanceof VariableDynamicImportError);
});

test('throws when dynamic import imports does not contain a file extension', async (t) => {
  const ast = CustomParser.parse('import(`./foo/${bar}`);', {
    sourceType: 'module'
  });

  let error;
  try {
    await dynamicImportToGlob(
      ast.body[0].expression.arguments[0],
      '${sourceString}',
      __filename,
      mockRollup
    );
  } catch (e) {
    error = e;
  }
  t.is(
    error.message,
    'invalid import "${sourceString}". A file extension must be included in the static part of the import. For example: import(`./foo/${bar}.js`).'
  );
  t.true(error instanceof VariableDynamicImportError);
});
