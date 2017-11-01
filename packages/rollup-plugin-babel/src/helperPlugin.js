// that is basically babel-plugin-external-helpers
import { HELPERS } from './constants.js';

export default function importHelperPlugin ({ types: t }) {
	return {
		pre (file) {
			file.set('helpersNamespace', t.identifier(HELPERS));
		}
	};
}
