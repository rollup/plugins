/* eslint-disable no-undefined */
import path from 'path';
import os from 'os';
import fs from 'fs';
import { setInterval } from 'timers/promises';

import progress, { Options } from '../src/index';

const log = (options?: Options) => async () => {
  const progressBar = progress(options);
  const arg = undefined;
  for await (const startTime of setInterval(200, Date.now())) {
    const now = Date.now();
    const id = path.resolve(
      path.resolve(),
      'node_modules',
      parseInt((Math.random() * 10).toString(), 10)
        .toString()
        .repeat(Math.random() * 100)
    );
    // TODO
    (progressBar.load! as any).bind(arg)(id);
    (progressBar.transform! as any).bind(arg)('', id);
    if (now - startTime > 2000) break;
  }
  (progressBar.generateBundle! as any).bind(undefined as any)(arg, arg, arg);
};

beforeAll(() => {
  const totalFilePath = path.resolve(
    os.tmpdir(),
    '@rollup/plugin-progress',
    path.basename(path.resolve())
  );
  if (fs.existsSync(totalFilePath)) {
    fs.unlinkSync(totalFilePath);
  }
});

test('clearLine default', log());

test('clearLine true', log({ clearLine: true }));

test('clearLine false', log({ clearLine: false }));
