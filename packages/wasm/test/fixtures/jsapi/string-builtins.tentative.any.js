// META: global=window,dedicatedworker,jsshell,shadowrealm

import * as wasmModule from './resources/js-string-builtins.wasm';

promise_test(async () => {
  // Hoisted into a static import to avoid TLA bug https://github.com/rollup/rollup/issues/6010.
  // const wasmModule = await import("./resources/js-string-builtins.wasm");

  assert_equals(wasmModule.getLength("hello"), 5);
  assert_equals(wasmModule.concatStrings("hello", " world"), "hello world");
  assert_equals(wasmModule.compareStrings("test", "test"), 1);
  assert_equals(wasmModule.compareStrings("test", "different"), 0);
  assert_equals(wasmModule.testString("hello"), 1);
  assert_equals(wasmModule.testString(42), 0);
}, "String builtins should be supported in imports in ESM integration");
