import sample from './sample.wasm';
// atob doesn't exist in node, so we fake it
// in the browser, globalThis.atob will exist
// eslint-disable-next-line no-undef
globalThis.atob = (str) => Buffer.from(str, 'base64').toString('binary');
// trick the wasm loader into thinking we are in the browser
const realProcess = process;
// eslint-disable-next-line no-global-assign, no-undefined
process = undefined;
sample({});
// eslint-disable-next-line no-global-assign
process = realProcess;
realProcess.exit(0);
