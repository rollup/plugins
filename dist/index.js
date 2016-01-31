'use strict';

var path = require('path');
path = 'default' in path ? path['default'] : path;
var rollupPluginutils = require('rollup-pluginutils');
var eslint = require('eslint');

function normalizePath(id) {
    return path.relative(process.cwd(), id).split(path.sep).join('/');
}

function eslint$1() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var cli = new eslint.CLIEngine(options);
    var formatter = options.formatter;

    if (typeof formatter !== 'function') {
        formatter = cli.getFormatter(formatter);
    }

    var filter = rollupPluginutils.createFilter(options.include, options.exclude || 'node_modules/**');

    return {
        transform: function transform(code, id) {
            var file = normalizePath(id);
            if (cli.isPathIgnored(file) || !filter(id)) {
                return;
            }

            var report = cli.executeOnText(code, file);

            if (!report.errorCount && !report.warningCount) {
                return;
            }

            console.log(formatter(report.results) || '');

            if (options.throwError) {
                var err = Error('Warnings or errors were found');
                err.name = 'ESLintError';
                throw err;
            }
        }
    };
};

module.exports = eslint$1;