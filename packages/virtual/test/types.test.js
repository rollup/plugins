const path = require('path');

const { existsSync } = require('fs');

const ts = require('typescript');

const modes = [
  ['Node16', ts.ModuleKind.Node16, ts.ModuleResolutionKind.Node16],
  ['NodeNext', ts.ModuleKind.NodeNext, ts.ModuleResolutionKind.NodeNext]
];

// The rollup type declarations reference Symbol.asyncDispose, which requires the disposable lib.
// Only TypeScript 5.2 and later ship that lib; older versions fall back to skipping lib checks.
const disposableLib = 'lib.esnext.disposable.d.ts';
const hasDisposableLib = existsSync(
  path.join(path.dirname(require.resolve('typescript')), disposableLib)
);

function diagnostics(fixture, module, moduleResolution) {
  const program = ts.createProgram([path.join(__dirname, 'fixtures', 'types', fixture)], {
    esModuleInterop: true,
    module,
    moduleResolution,
    noEmit: true,
    ...(hasDisposableLib
      ? { lib: ['lib.es2019.d.ts', disposableLib], skipLibCheck: false }
      : { skipLibCheck: true }),
    strict: true,
    target: ts.ScriptTarget.ES2019,
    types: []
  });

  return ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}

for (const [name, module, moduleResolution] of modes) {
  test(`supports default imports in ${name} ES modules`, () => {
    expect(diagnostics('esm.mts', module, moduleResolution)).toEqual([]);
  });

  test(`supports default imports in ${name} CommonJS modules`, () => {
    expect(diagnostics('commonjs.cts', module, moduleResolution)).toEqual([]);
  });
}

test('supports default imports with legacy Node resolution', () => {
  expect(diagnostics('legacy.ts', ts.ModuleKind.CommonJS, ts.ModuleResolutionKind.NodeJs)).toEqual(
    []
  );
});
