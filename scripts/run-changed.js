const execa = require('execa'); // eslint-disable-line import/no-extraneous-dependencies

const [, , task] = process.argv;
const { stderr, stdout } = process;

(async () => {
  const rePkg = /(packages\/([\w\-_.]+))\/?/;
  const { stdout: diff } = await execa('git', ['diff', 'master...HEAD', '--name-only']);
  const filters = diff
    .split('\n')
    .filter((line) => rePkg.test(line))
    .map((line) => {
      const [, directory] = line.match(rePkg);
      return `--filter ./${directory}`;
    });
  const args = ['recursive', 'run', task].concat(Array.from(new Set(filters)));
  await execa('pnpm', args, { stdout, stderr });
})();
