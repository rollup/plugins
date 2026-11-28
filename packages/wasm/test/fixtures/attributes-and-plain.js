/* eslint-disable import/no-duplicates */
import plain from './sample.wasm';
import attributed from './sample.wasm' with { type: 'webassembly' };

export default { attributed, plain };
