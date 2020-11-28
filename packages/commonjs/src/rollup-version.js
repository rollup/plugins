export default function validateRollupVersion(rollupVersion, peerDependencyVersion) {
  const [major, minor] = rollupVersion.split('.').map(Number);
  const versionRegexp = /\^(\d+\.\d+)\.\d+/g;
  let minMajor = Infinity;
  let minMinor = Infinity;
  let foundVersion;
  // eslint-disable-next-line no-cond-assign
  while ((foundVersion = versionRegexp.exec(peerDependencyVersion))) {
    const [foundMajor, foundMinor] = foundVersion[1].split('.').map(Number);
    if (foundMajor < minMajor) {
      minMajor = foundMajor;
      minMinor = foundMinor;
    }
  }
  if (major < minMajor || (major === minMajor && minor < minMinor)) {
    throw new Error(
      `Insufficient Rollup version: "@rollup/plugin-commonjs" requires at least rollup@${minMajor}.${minMinor} but found rollup@${rollupVersion}.`
    );
  }
}
