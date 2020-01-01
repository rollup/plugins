/*
  Flags:

  --major
  --minor
  --patch

  Get list of tags for plugin
  git tag --list pluginutils* --sort=-taggerdate

  Get list of commits from last plugin tag
  git log --grep "(pluginutils)" --pretty=format:%s pluginutils-v3.0.1..HEAD

  Sample output:
  fix(pluginutils): makeLegalIdentifier - potentially unsafe input for blacklisted identifier (#116)
  docs(pluginutils): Fix documented type of createFilter's include/exclude (#123)
  chore(pluginutils): update minor linting correction

  Parse messages.

  - docs: patch
  - fix: patch
  - feat: minor
  - chore: none, bail

  Update package.json with new semver

  Create Version Changes
  - ignore /chore(release)/ commits
  - list breaking changes
  Update Changelog

  Add package.json
  Add Changelog.md
  Commit: chore(release): {plugin} v{version}

  Tag: {plugin}-v{version}

  NPM publish

  git push && git push --tags
*/

/*
  https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-commits-parser

*/
