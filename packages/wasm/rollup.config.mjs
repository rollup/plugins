import { readFileSync } from 'fs';

import { createConfig } from '../../shared/rollup.config.mjs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default createConfig({ pkg });
