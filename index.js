const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const { builtinModules } = require('module');

function exec(cmd) {
	return new Promise((fulfil, reject) => {
		child_process.exec(cmd, (err, stdout, stderr) => {
			if (err) reject(err);
			else fulfil();
		});
	});
}

module.exports = function(opts = {}) {
	const pkgFile = path.resolve(opts.pkgFile || 'package.json');
	let pkg;

	if (fs.existsSync(pkgFile)) {
		pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
	} else {
		fs.writeFileSync(pkgFile, '{}');
		pkg = {};
	}

	const installed = new Set(Object.keys(pkg.dependencies || {}).concat(builtinModules));

	const manager = opts.manager || (fs.existsSync('yarn.lock') ? 'yarn' : 'npm');
	const cmd = (
		manager === 'yarn' ? 'yarn add' :
		manager === 'npm' ? 'npm install' :
		null
	);

	if (!cmd) {
		throw new Error(`${manager} is not a valid package manager — must be 'npm' or 'yarn'`);
	}

	return {
		name: 'auto-install',

		async resolveId(importee, importer) {
			if (!importer) return; // entry module

			// this function doesn't actually resolve anything, but it
			// provides us with a hook to discover uninstalled deps

			if (importee[0] !== '.' && !path.isAbsolute(importee)) {
				// we have a bare import — check it's installed
				const parts = importee.split('/');
				let name = parts.shift();
				if (name[0] === '@') name += `/${parts.shift()}`;

				if (!installed.has(name)) {
					installed.add(name);
					console.log(`installing ${name}...`)
					await exec(`${cmd} ${name}`);
				}
			}
		}
	};
};