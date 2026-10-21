import type { Plugin } from 'rollup';

import virtual, { type RollupVirtualOptions } from '../../..';

const modules: RollupVirtualOptions = { entry: 'export default 42' };
const plugin: Plugin = virtual(modules);

export default plugin;
