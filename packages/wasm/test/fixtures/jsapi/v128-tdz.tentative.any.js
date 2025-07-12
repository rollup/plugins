// META: global=window,dedicatedworker,jsshell,shadowrealm

import * as exporterModule from './resources/mutable-global-export.wasm';
import * as reexporterModule from './resources/mutable-global-reexport.wasm';

promise_test(async () => {
  // Hoisted into a static import to avoid TLA bug https://github.com/rollup/rollup/issues/6010.
  // const exporterModule = await import("./resources/mutable-global-export.wasm");
  // const reexporterModule = await import(
  //   "./resources/mutable-global-reexport.wasm"
  // );

  assert_throws_js(ReferenceError, () => exporterModule.v128Export);
  assert_throws_js(ReferenceError, () => reexporterModule.reexportedV128Export);
}, "v128 global exports should cause TDZ errors");
