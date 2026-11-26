const path = require('path');

const ts = require('typescript');

const modes = [
  ['Node16', ts.ModuleKind.Node16, ts.ModuleResolutionKind.Node16],
  ['NodeNext', ts.ModuleKind.NodeNext, ts.ModuleResolutionKind.NodeNext]
];

const TYPES_TEST_TIMEOUT = 30_000;

function diagnostics(fixture, module, moduleResolution) {
  const program = ts.createProgram([path.join(__dirname, 'fixtures', 'types', fixture)], {
    esModuleInterop: true,
    module,
    moduleResolution,
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ES2019,
    types: ['node']
  });

  return ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}

for (const [name, module, moduleResolution] of modes) {
  test(`supports default imports in ${name} ES modules`, { timeout: TYPES_TEST_TIMEOUT }, () => {
    expect(diagnostics('esm.mts', module, moduleResolution)).toEqual([]);
  });

  test(
    `supports default imports in ${name} CommonJS modules`,
    { timeout: TYPES_TEST_TIMEOUT },
    () => {
      expect(diagnostics('commonjs.cts', module, moduleResolution)).toEqual([]);
    }
  );
}

test(
  'supports default imports with legacy Node resolution',
  { timeout: TYPES_TEST_TIMEOUT },
  () => {
    expect(
      diagnostics('legacy.ts', ts.ModuleKind.CommonJS, ts.ModuleResolutionKind.NodeJs)
    ).toEqual([]);
  }
);
