const path = require("path");
const { createFilter } = require("rollup-pluginutils");
const { CLIEngine } = require("eslint");

function normalizePath(id) {
  return path
    .relative(process.cwd(), id)
    .split(path.sep)
    .join("/");
}

function eslint(options = {}) {
  if (typeof options === "string") {
    const configFile = path.resolve(process.cwd(), options);
    options = require(configFile);
    options.useEslintrc = false; // Tell eslint not to look for configuration files.
  }

  const cli = new CLIEngine(options);
  let formatter = options.formatter;

  if (typeof formatter !== "function") {
    formatter = cli.getFormatter(formatter || "stylish");
  }

  const filter = createFilter(
    options.include,
    options.exclude || /node_modules/
  );

  return {
    name: "eslint",

    transform(code, id) {
      const file = normalizePath(id);
      if (cli.isPathIgnored(file) || !filter(id)) {
        return null;
      }

      const report = cli.executeOnText(code, file);
      const hasWarnings = options.throwOnWarning && report.warningCount !== 0;
      const hasErrors = options.throwOnError && report.errorCount !== 0;

      if (options.fix && report) {
        CLIEngine.outputFixes(report);
      }

      if (report.warningCount === 0 && report.errorCount === 0) {
        return null;
      }

      const result = formatter(report.results);

      if (result) {
        console.log(result);
      }

      if (hasWarnings && hasErrors) {
        throw Error("Warnings or errors were found");
      }

      if (hasWarnings) {
        throw Error("Warnings were found");
      }

      if (hasErrors) {
        throw Error("Errors were found");
      }
    }
  };
}

exports.eslint = eslint;
