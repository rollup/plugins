// META: global=window,dedicatedworker,jsshell,shadowrealm

import { logExec } from './resources/wasm-import-from-wasm.wasm';

promise_test(async () => {
  globalThis.log = [];

  // Hoisted into a static import to avoid TLA bug https://github.com/rollup/rollup/issues/6010.
  // const { logExec } = await import("./resources/wasm-import-from-wasm.wasm");
  logExec();

  assert_equals(globalThis.log.length, 1, "log should have one entry");
  assert_equals(globalThis.log[0], "executed");

  // Clean up
  delete globalThis.log;
}, "Check import and export between WebAssembly modules");
