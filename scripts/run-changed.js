const execa = require('execa');

const { log } = console;

(async () => {
  const rePkg = /(packages\/([\w\-\_\.]+))\/?/;
  const { stdout } = await execa('git', ['diff', '--name-only']);
  const filters = stdout.split('\n')
    .filter((line) => rePkg.test(line))
    .map((line) => {
      const [,directory] = line.match(rePkg);
      return '--filter ./' + directory;
    });


})();
