// META: global=window,dedicatedworker,jsshell,shadowrealm

import { f } from './resources/js-wasm-cycle.js';

promise_test(async () => {
  // Hoisted into a static import to avoid TLA bug https://github.com/rollup/rollup/issues/6010.
  // const { f } = await import("./resources/js-wasm-cycle.js");

  assert_equals(f(), 24);
}, "Check bindings in JavaScript and WebAssembly cycle (JS higher)");
