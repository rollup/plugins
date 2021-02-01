/* eslint-disable import/no-extraneous-dependencies */
const micromatch = require('micromatch');
const prettier = require('prettier');

const prettierSupportedExtensions = prettier
  .getSupportInfo()
  .languages.map(({ extensions }) => extensions)
  .flat();
const addQuotes = (a) => `"${a}"`;

module.exports = (allStagedFiles) => {
  const eslintFiles = micromatch(allStagedFiles, '**/*.{ts,js}');
  const prettierFiles = micromatch(
    allStagedFiles,
    prettierSupportedExtensions.map((extension) => `**/*${extension}`)
  );
  return [
    eslintFiles.length && `eslint --fix ${eslintFiles.map(addQuotes).join(' ')}`,
    prettierFiles.length && `prettier --write ${prettierFiles.map(addQuotes).join(' ')}`
  ].filter(Boolean);
};
