import { squash } from 'butternut';

export default function butternut(options) {
	return {
		name: 'butternut',

		transformBundle: function(code) {
			return squash(code, options);
		}
	};
}
