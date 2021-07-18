import 'source-map-support/register';

import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

import parser from 'conventional-commits-parser';
import chalk from 'chalk';
import execa from 'execa';
import semver from 'semver';
import writePackage from 'write-pkg';
import yargs from 'yargs-parser';

const { log } = console;
const parserOptions = {
  noteKeywords: ['BREAKING CHANGE', 'Breaking Change']
};
const reBreaking = new RegExp(`(${parserOptions.noteKeywords.join(')|(')})`);
const dryRun = process.argv.includes('--dry');
const noPublish = process.argv.includes('--no-publish');
const noTag = process.argv.includes('--no-tag');

type Commit = parser.Commit<string | number | symbol>;

interface BreakingCommit {
  breaking: boolean;
}

interface Notes {
  breaking: string[];
  features: string[];
  fixes: string[];
  updates: string[];
}

interface RepoPackage {
  [key: string]: any;
  name: string;
  version: string;
}

const commitChanges = async (cwd: string, shortName: string, version: string) => {
  if (dryRun) {
    log(chalk`{yellow Skipping Git Commit}`);
    return;
  }

  log(chalk`{blue Committing} CHANGELOG.md, package.json`);
  let params = ['add', cwd];
  await execa('git', params);

  params = ['commit', '--m', `chore(release): ${shortName} v${version}`];
  await execa('git', params);
};

const getCommits = async (shortName: string, stripScope: string[]) => {
  log(chalk`{blue Gathering Commits}`);

  let params = ['tag', '--list', `${shortName}-v*`, '--sort', '-v:refname'];
  const { stdout: tags } = await execa('git', params);
  const [latestTag] = tags.split('\n');

  log(chalk`{blue Last Release Tag}: ${latestTag || '<none>'}`);

  params = ['--no-pager', 'log', `${latestTag}..HEAD`, '--format=%B%n-hash-%n%H🐒💨🙊'];
  const scope = stripScope.reduce((prev, strip) => prev.replace(strip, ''), shortName);
  const rePlugin = new RegExp(`^[\\w\\!]+\\(([\\w,]+)?${scope}([\\w,]+)?\\)`, 'i');
  let { stdout } = await execa('git', params);

  if (!stdout) {
    if (latestTag) params.splice(2, 1, `${latestTag}`);
    else params.splice(2, 1, 'HEAD');
    ({ stdout } = await execa('git', params));
  }

  const commits = stdout
    .split('🐒💨🙊')
    .filter((commit: string) => {
      const chunk = commit.trim();
      return chunk && rePlugin.test(chunk);
    })
    .map((commit) => {
      const node = parser.sync(commit);
      const body = (node.body || node.footer) as string;

      ((node as unknown) as BreakingCommit).breaking =
        reBreaking.test(body) || /!:/.test(node.header as string);

      return node;
    });

  return commits;
};

const getNewVersion = (version: string, commits: Commit[]): string | null => {
  log(chalk`{blue Determining New Version}`);
  const intersection = process.argv.filter((arg) =>
    ['--major', '--minor', '--patch'].includes(arg)
  );
  if (intersection.length) {
    // we found an edge case in the typescript-eslint plguin
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return semver.inc(version, intersection[0].substring(2) as semver.ReleaseType);
  }

  const types = new Set(commits.map(({ type }) => type));
  const breaking = commits.some((commit) => !!commit.breaking);
  const level = breaking ? 'major' : types.has('feat') || types.has('feature') ? 'minor' : 'patch';

  return semver.inc(version, level);
};

const publish = async (cwd: string) => {
  if (dryRun || noPublish) {
    log(chalk`{yellow Skipping Publish}`);
    return;
  }

  log(chalk`\n{cyan Publishing to NPM}`);

  await execa('npm', ['publish', '--no-git-checks'], { cwd, stdio: 'inherit' });
};

const tag = async (cwd: string, shortName: string, version: string) => {
  if (dryRun || noTag) {
    log(chalk`{yellow Skipping Git Tag}`);
    return;
  }

  const tagName = `${shortName}-v${version}`;
  log(chalk`\n{blue Tagging} {grey ${tagName}}`);
  await execa('git', ['tag', tagName], { cwd, stdio: 'inherit' });
};

const updateChangelog = (commits: Commit[], cwd: string, shortName: string, version: string) => {
  log(chalk`{blue Gathering Changes}`);

  const plugin = shortName === 'pluginutils' ? shortName : `plugin-${shortName}`;
  const title = `# @rollup/${plugin} ChangeLog`;
  const [date] = new Date().toISOString().split('T');
  const logPath = join(cwd, 'CHANGELOG.md');
  const logFile = existsSync(logPath) ? readFileSync(logPath, 'utf-8') : '';
  const oldNotes = logFile.startsWith(title) ? logFile.slice(title.length).trim() : logFile;
  const notes: Notes = { breaking: [], features: [], fixes: [], updates: [] };

  for (const { breaking, hash, header, type } of commits) {
    const ref = /\(#\d+\)/.test(header as string) ? '' : ` (${hash?.substring(0, 7)})`;
    const message = header?.trim().replace(/\(.+\)/, '') + ref;
    if (breaking) {
      notes.breaking.push(message);
    } else if (type === 'fix') {
      notes.fixes.push(message);
    } else if (type === 'feat' || type === 'feature') {
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

const updatePackage = async (cwd: string, pkg: RepoPackage, version: string) => {
  if (dryRun) {
    log(chalk`{yellow Skipping package.json Update}`);
    return;
  }

  log(chalk`{blue Updating} package.json`);
  // eslint-disable-next-line no-param-reassign
  pkg.version = version;
  await writePackage(cwd, pkg);
};

(async () => {
  try {
    const argv = yargs(process.argv.slice(2));
    const packagePath = argv.packagePath || 'packages';
    const stripScope = argv.stripScope?.split(',') || [];
    const packageName = argv.pkg;
    const shortName = packageName.replace(/^@.+\//, '').replace('plugin-', '');
    const cwd = join(process.cwd(), `/${packagePath}/`, shortName);

    if (!cwd || !existsSync(cwd)) {
      throw new RangeError(`Could not find directory for package: ${packageName}`);
    }

    const { default: pkg }: RepoPackage = await import(join(cwd, 'package.json'));

    if (dryRun) {
      log(chalk`{magenta DRY RUN}: No files will be modified`);
    }

    log(chalk`{cyan Releasing \`${packageName}\`} from {grey packages/${shortName}}\n`);

    const commits = await getCommits(shortName, stripScope);

    if (!commits.length) {
      log(chalk`\n{red No Commits Found}. Did you mean to publish ${packageName}?`);
      return;
    }

    log(chalk`{blue Found} {bold ${commits.length}} Commits\n`);

    const newVersion = getNewVersion(pkg.version, commits) as string;

    log(chalk`{blue New Version}: ${newVersion}\n`);

    await updatePackage(cwd, pkg, newVersion);
    updateChangelog(commits, cwd, shortName, newVersion);
    await commitChanges(cwd, shortName, newVersion);
    await publish(cwd);
    await tag(cwd, shortName, newVersion);
  } catch (e) {
    log(e);
    process.exit(1);
  }
})();
