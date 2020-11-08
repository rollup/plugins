#!/usr/bin/env node

/* eslint-disable  import/no-extraneous-dependencies, import/no-dynamic-require, no-await-in-loop, global-require  */

const { join } = require('path');
const { readFileSync, writeFileSync } = require('fs');

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
const dryRun = process.argv.includes('--dry');
const noPush = process.argv.includes('--no-push');
const noTag = process.argv.includes('--no-tag');

const commitChanges = async (cwd, pluginName, version) => {
  if (dryRun) {
    log(chalk`{yellow Skipping Git Commit}`);
    return;
  }

  log(chalk`{blue Committing} CHANGELOG.md, package.json`);
  let params = ['add', cwd];
  await execa('git', params);

  params = ['commit', '--m', `chore(release): ${pluginName} v${version}`];
  await execa('git', params);
};

const getCommits = async (pluginName) => {
  log(chalk`{blue Gathering Commits}`);

  let params = ['tag', '--list', `${pluginName}-v*`, '--sort', '-v:refname'];
  const { stdout: tags } = await execa('git', params);
  const [latestTag] = tags.split('\n');

  log(chalk`{blue Last Release Tag}: ${latestTag}`);

  // i wanted to use '--grep', `"(${pluginName})"` here, but there's something up with execa
  // https://github.com/sindresorhus/execa/issues/406 - FIXED
  // TODO: const params = ['log', '--grep', '"(pluginutils)"', 'pluginutils-v3.0.1..HEAD'];
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

      node.breaking = reBreaking.test(node.body || node.footer) || /!:/.test(node.header);

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
  const breaking = commits.some((commit) => !!commit.breaking);
  const level = breaking ? 'major' : types.has('feat') ? 'minor' : 'patch';

  return semver.inc(version, level);
};

const publish = async (cwd) => {
  if (dryRun) {
    log(chalk`{yellow Skipping Publish}`);
    return;
  }

  log(chalk`\n{cyan Publishing to NPM}`);

  await execa('pnpm', ['publish'], { cwd, stdio: 'inherit' });
};

const push = async () => {
  if (dryRun || noPush) {
    log(chalk`{yellow Skipping Git Push}`);
    return;
  }

  log(chalk`{blue Pushing Release and Tags}`);
  await execa('git', ['push']);
  await execa('git', ['push', '--tags']);
};

const tag = async (cwd, pluginName, version) => {
  if (dryRun || noTag) {
    log(chalk`{yellow Skipping Git Tag}`);
    return;
  }

  const tagName = `${pluginName}-v${version}`;
  log(chalk`\n{blue Tagging} {grey ${tagName}}`);
  await execa('git', ['tag', tagName], { cwd, stdio: 'inherit' });
};

const updateChangelog = (commits, cwd, pluginName, version) => {
  log(chalk`{blue Gathering Changes}`);

  const plugin = pluginName === 'pluginutils' ? pluginName : `plugin-${pluginName}`;
  const title = `# @rollup/${plugin} ChangeLog`;
  const [date] = new Date().toISOString().split('T');
  const logPath = join(cwd, 'CHANGELOG.md');
  const logFile = readFileSync(logPath, 'utf-8');
  const oldNotes = logFile.startsWith(title) ? logFile.slice(title.length).trim() : logFile;
  const notes = { breaking: [], fixes: [], features: [], updates: [] };

  for (const { breaking, hash, header, type } of commits) {
    const ref = /\(#\d+\)/.test(header) ? '' : ` (${hash.substring(0, 7)})`;
    const message = header.trim().replace(`(${pluginName})`, '') + ref;
    if (breaking) {
      notes.breaking.push(message);
    } else if (type === 'fix') {
      notes.fixes.push(message);
    } else if (type === 'feat') {
      notes.features.push(message);
    } else {
      notes.updates.push(message);
    }
  }

  const parts = [
    `## v${version}`,
    `_${date}_`,
    notes.breaking.length ? `### Breaking Changes\n\n- ${notes.breaking.join('\n- ')}`.trim() : '',
    notes.fixes.length ? `### Bugfixes\n\n- ${notes.fixes.join('\n- ')}`.trim() : '',
    notes.features.length ? `### Features\n\n- ${notes.features.join('\n- ')}`.trim() : '',
    notes.updates.length ? `### Updates\n\n- ${notes.updates.join('\n- ')}`.trim() : ''
  ].filter(Boolean);

  const newLog = parts.join('\n\n');

  if (dryRun) {
    log(chalk`{blue New ChangeLog}:\n${newLog}`);
    return;
  }

  log(chalk`{blue Updating} CHANGELOG.md`);
  const content = [title, newLog, oldNotes].filter(Boolean).join('\n\n');
  writeFileSync(logPath, content, 'utf-8');
};

const updatePackage = async (cwd, pkg, version) => {
  if (dryRun) {
    log(chalk`{yellow Skipping package.json Update}`);
    return;
  }

  log(chalk`{blue Updating} package.json`);
  pkg.version = version; // eslint-disable-line no-param-reassign
  await writePackage(cwd, pkg);
};

(async () => {
  try {
    const [, , pluginName] = process.argv;
    const cwd = join(packagesPath, pluginName);
    const pkg = require(join(cwd, 'package.json'));

    if (dryRun) {
      log(chalk`{magenta DRY RUN}: No files will be modified`);
    }

    log(chalk`{cyan Publishing \`${pluginName}\`} from {grey packages/${pluginName}}\n`);

    const commits = await getCommits(pluginName);

    if (!commits.length) {
      log(chalk`\n{red No Commits Found}. Did you mean to publish ${pluginName}?`);
      return;
    }

    log(chalk`{blue Found} {bold ${commits.length}} Commits\n`);

    const newVersion = getNewVersion(pkg.version, commits);

    log(chalk`{blue New Version}: ${newVersion}\n`);

    await updatePackage(cwd, pkg, newVersion);
    await updateChangelog(commits, cwd, pluginName, newVersion);
    await commitChanges(cwd, pluginName, newVersion);
    await publish(cwd);
    await tag(cwd, pluginName, newVersion);
    await push();
  } catch (e) {
    log(e);
  }
})();
