/* eslint-disable no-await-in-loop -- Each watch edit depends on the previous build. */
const fs = require('fs');
const path = require('path');

const { watch } = require('rollup');

const typescript = require('..');

function waitForBuild(watcher, buildNumber) {
  return new Promise((resolve, reject) => {
    let result;
    const timer = setTimeout(() => {
      watcher.off('event', handleEvent);
      reject(new Error(`Timed out waiting for watch build ${buildNumber}`));
    }, 10000);
    function handleEvent(event) {
      if (event.code === 'ERROR' || event.code === 'BUNDLE_END') result = event;
      if (event.code === 'END') {
        clearTimeout(timer);
        watcher.off('event', handleEvent);
        resolve(result);
      }
    }
    watcher.on('event', handleEvent);
  });
}

for (const { startsWithError, dependency } of [
  { startsWithError: true, dependency: 'root' },
  { startsWithError: false, dependency: 'root' },
  { startsWithError: true, dependency: 'imported' },
  { startsWithError: true, dependency: 'excluded type-only' }
]) {
  test.sequential(
    `recovers from consecutive type errors in watch mode (${
      startsWithError ? 'invalid' : 'valid'
    } initial build, ${dependency} file)`,
    async () => {
      const outputDir = path.join(__dirname, 'output');
      fs.mkdirSync(outputDir, { recursive: true });
      const dir = fs.mkdtempSync(path.join(outputDir, 'watch-no-emit-'));
      const input = path.join(dir, 'main.ts');
      const edited = dependency === 'root' ? input : path.join(dir, 'dep.ts');
      const typeOnly = dependency === 'excluded type-only';
      const output = path.join(dir, 'bundle.js');
      const tsconfig = path.join(dir, 'tsconfig.json');
      const builds = [
        ...(startsWithError ? [] : [{ source: 'export const value: number = 1;', valid: true }]),
        {
          source: typeOnly
            ? 'export type Value = string;'
            : "export const value: number = 'invalid-one';",
          valid: false
        },
        {
          source: typeOnly
            ? 'export type Value = boolean;'
            : "export const value: number = 'invalid-two';",
          valid: false
        },
        {
          source: typeOnly ? 'export type Value = number;' : 'export const value: number = 42;',
          valid: true
        }
      ];
      if (typeOnly) {
        fs.writeFileSync(
          input,
          "import type { Value } from './dep'; export const value: Value = 42;"
        );
      } else if (dependency === 'imported') {
        fs.writeFileSync(input, "export { value } from './dep';");
      }
      fs.writeFileSync(edited, builds[0].source);
      fs.writeFileSync(
        tsconfig,
        JSON.stringify({
          compilerOptions: {
            module: 'esnext',
            target: 'es2015',
            noEmitOnError: true,
            types: [],
            skipLibCheck: true
          },
          files: ['main.ts']
        })
      );
      const watcher = watch({
        input,
        output: { file: output, format: 'es' },
        plugins: [typescript({ tsconfig, ...(typeOnly ? { exclude: [edited] } : {}) })]
      });
      let previousOutput;
      let previousMtime;
      try {
        let nextBuild = waitForBuild(watcher, 0);
        for (let i = 0; i < builds.length; i += 1) {
          const build = builds[i];
          const event = await nextBuild;
          expect(event.code).toBe(build.valid ? 'BUNDLE_END' : 'ERROR');
          if (build.valid) {
            await event.result.close();
            const code = fs.readFileSync(output, 'utf8');
            expect(code).toContain(i === builds.length - 1 ? 'value = 42' : 'value = 1');
            previousOutput = code;
            previousMtime = fs.statSync(output).mtimeMs;
          } else {
            expect(event.error.plugin).toBe('typescript');
            expect(event.error.pluginCode).toBe('TS2322');
            if (previousOutput) {
              expect(fs.readFileSync(output, 'utf8')).toBe(previousOutput);
              expect(fs.statSync(output).mtimeMs).toBe(previousMtime);
            } else {
              expect(fs.existsSync(output)).toBe(false);
            }
          }
          if (i + 1 < builds.length) {
            nextBuild = waitForBuild(watcher, i + 1);
            await fs.promises.writeFile(edited, builds[i + 1].source);
          }
        }
      } finally {
        await watcher.close();
        fs.rmSync(dir, { recursive: true, force: true });
      }
    },
    30000
  );
}

test.sequential(
  'reports type-only watch warnings when noEmitOnError is false',
  async () => {
    const outputDir = path.join(__dirname, 'output');
    fs.mkdirSync(outputDir, { recursive: true });
    const dir = fs.mkdtempSync(path.join(outputDir, 'watch-warnings-'));
    const input = path.join(dir, 'main.ts');
    const dependency = path.join(dir, 'dep.ts');
    const output = path.join(dir, 'bundle.js');
    const tsconfig = path.join(dir, 'tsconfig.json');
    fs.writeFileSync(input, "import type { Value } from './dep'; export const value: Value = 42;");
    fs.writeFileSync(dependency, 'export type Value = number;');
    fs.writeFileSync(
      tsconfig,
      JSON.stringify({
        compilerOptions: { module: 'esnext', target: 'es2015', noEmitOnError: false, types: [] },
        files: ['main.ts']
      })
    );
    let receiveWarning;
    const watcher = watch({
      input,
      output: { file: output, format: 'es' },
      plugins: [typescript({ tsconfig, exclude: [dependency] })],
      onwarn(warning) {
        if (receiveWarning) receiveWarning(warning);
      }
    });
    try {
      const initial = await waitForBuild(watcher, 0);
      expect(initial.code).toBe('BUNDLE_END');
      await initial.result.close();
      const nextWarning = new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Timed out waiting for a type warning')),
          10000
        );
        receiveWarning = (warning) => {
          clearTimeout(timer);
          resolve(warning);
        };
      });
      await fs.promises.writeFile(dependency, 'export type Value = string;');
      const warning = await nextWarning;
      expect(warning.plugin).toBe('typescript');
      expect(warning.pluginCode).toBe('TS2322');
    } finally {
      await watcher.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
  30000
);
