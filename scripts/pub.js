#!/usr/bin/env node

/* eslint-disable  import/no-extraneous-dependencies, import/no-dynamic-require, no-await-in-loop, global-require  */

const { join } = require('path');

const parser = require('conventional-commits-parser');
const chalk = require('chalk');
const execa = require('execa');
const semver = require('semver');
const writePackage = require('write-pkg');

const packagesPath = join(__dirname, '..', 'packages');
const { log } = console;
const parserOptions = {
  noteKeywords: ['BREAKING CHANGE', 'Breaking Change']
};
const reBreaking = new RegExp(`(${parserOptions.noteKeywords.join(')|(')})`);

const commitChanges = async (cwd, pluginName, version) => {
  log(chalk`{blue Committing} CHANGELOG.md, package.json`);
  let params = ['add', cwd];
  await execa('git', params);

  params = ['commit', '--m', `chore(${pluginName}): release v${version}`];
  await execa('git', params);
};

const getCommits = async (pluginName) => {
  log(chalk`{blue Gathering Commits}`);

  let params = ['tag', '--list', `${pluginName}-v*`, '--sort', '-taggerdate'];
  const { stdout: tags } = await execa('git', params);
  const [latestTag] = tags.split('\n');

  log(chalk`{blue Last Release Tag}: ${latestTag}`);

  // i wanted to use '--grep', `"(${pluginName})"` here, but there's something up with execa
  // https://github.com/sindresorhus/execa/issues/406
  params = ['--no-pager', 'log', `${latestTag}..HEAD`, '--format=%B%n-hash-%n%H🐒💨🙊'];
  const rePlugin = new RegExp(`^[\\w\\!]+\\(${pluginName}\\)`, 'i');
  const { stdout } = await execa('git', params);
  const commits = stdout
    .split('🐒💨🙊')
    .filter((commit) => {
      const chunk = commit.trim();
      return chunk && rePlugin.test(chunk);
    })
    .map((commit) => {
      const node = parser.sync(commit);

      node.breaking = reBreaking.test(node.body || node.footer);

      return node;
    });

  return commits;
};

const getNewVersion = (version, commits) => {
  log(chalk`{blue Determining New Version}`);
  const intersection = process.argv.filter((arg) =>
    ['--major', '--minor', '--patch'].includes(arg)
  );
  if (intersection.length) {
    return semver.inc(version, intersection[0].substring(2));
  }

  const types = new Set(commits.map(({ type }) => type));
  const breaking = commits.reduce((result, commit) => !!commit.breaking, false);
  const level = breaking ? 'major' : types.has('feat') ? 'minor' : 'patch';
  return semver.inc(version, level);
};

const publish = async (cwd) => {
  log(chalk`\n{cyan Publishing to NPM}`);

  await execa('pnpm', ['publish'], { cwd, stdio: 'inherit' });
};

const push = async () => {
  log(chalk`{blue Pushing Release and Tags}`);
  await execa('git', ['push', '--follow-tags']);
};

const tag = async (cwd, pluginName, version) => {
  const tagName = `${pluginName}-v${version}`;
  log(chalk`\n{blue Tagging} {grey ${tagName}}`);
  await execa('git', ['tag', tagName], { cwd, stdio: 'inherit' });
};

const updatePackage = async (cwd, pkg, version) => {
  log(chalk`\n{blue Updating} package.json`);
  pkg.version = version; // eslint-disable-line no-param-reassign
  await writePackage(cwd, pkg);
};

(async () => {
  try {
    const [, , pluginName] = process.argv;
    const cwd = join(packagesPath, pluginName);
    const pkg = require(join(cwd, 'package.json'));

    log(chalk`{cyan Publishing \`${pluginName}\`} from {grey packages/${pluginName}}\n`);

    const commits = await getCommits(pluginName);

    if (!commits.length) {
      log(chalk`\n{red No Commits Found}. Did you mean to publish ${pluginName}?`);
    } else {
      log(chalk`{blue Found} {bold ${commits.length}} Commits\n`);
    }

    const newVersion = getNewVersion(pkg.version, commits);

    log(chalk`{blue New Version}: ${newVersion}\n`);

    await updatePackage(cwd, pkg, newVersion);
    // update Changelog
    await commitChanges(cwd, pluginName, newVersion);
    await publish(cwd);
    await tag(cwd, pluginName, newVersion);
    await push();
  } catch (e) {
    log(e);
  }
})();
/*

  Create Version Changes
  - ignore /chore(release)/ commits
  - list breaking changes
  Update Changelog

  Add package.json
  Add Changelog.md
  Commit: chore(release): {plugin} v{version}

*/
