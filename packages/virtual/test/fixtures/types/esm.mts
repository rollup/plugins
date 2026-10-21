import type { Plugin } from 'rollup';
import virtual, { type RollupVirtualOptions } from '@rollup/plugin-virtual';

const modules: RollupVirtualOptions = { entry: 'export default 42' };
const plugin: Plugin = virtual(modules);

virtual({});

// @ts-expect-error Virtual module sources must be strings.
virtual({ entry: 42 });

// @ts-expect-error A module map is required.
virtual();

export default plugin;
