import { TargetEnv } from '../types';

export const HELPERS_ID = '\0wasmHelpers.js';

const nodeFilePath = `
var fs = require("fs")
var path = require("path")

return new Promise((resolve, reject) => {
  fs.readFile(path.resolve(__dirname, filepath), (error, buffer) => {
    if (error != null) {
      reject(error)
    }

    resolve(_instantiateOrCompile(buffer, imports, false))
  });
});
`;

const nodeDecode = `
buf = Buffer.from(src, 'base64')
`;

const browserFilePath = `
return _instantiateOrCompile(fetch(filepath), imports, true);
`;

const browserDecode = `
var raw = globalThis.atob(src)
var rawLength = raw.length
buf = new Uint8Array(new ArrayBuffer(rawLength))
for(var i = 0; i < rawLength; i++) {
   buf[i] = raw.charCodeAt(i)
}
`;

const autoModule = `
var buf = null
var isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null

if (filepath && isNode) {
  ${nodeFilePath}
} else if (filepath) {
  ${browserFilePath}
}

if (isNode) {
  ${nodeDecode}
} else {
  ${browserDecode}
}
`;

const nodeModule = `
var buf = null
if (filepath) {
  ${nodeFilePath}
}

${nodeDecode}
`;

const browserModule = `
var buf = null
if (filepath) {
  ${browserFilePath}
}

${browserDecode}
`;

const autoInlineModule = `
var buf = null
var isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null
if (isNode) {
  ${nodeDecode}
} else {
  ${browserDecode}
}
`;

const envModule = (env: TargetEnv) => {
  switch (env) {
    case 'auto':
      return autoModule;
    case 'auto-inline':
      return autoInlineModule;
    case 'browser':
      return browserModule;
    case 'node':
      return nodeModule;
    default:
      return null;
  }
};

export const getHelpersModule = (env: TargetEnv) => `
function _loadWasmModule (sync, filepath, src, imports) {
  function _instantiateOrCompile(source, imports, stream) {
    var instantiateFunc = stream ? WebAssembly.instantiateStreaming : WebAssembly.instantiate;
    var compileFunc = stream ? WebAssembly.compileStreaming : WebAssembly.compile;

    if (imports) {
      return instantiateFunc(source, imports)
    } else {
      return compileFunc(source)
    }
  }

  ${envModule(env)}

  if(sync) {
    var mod = new WebAssembly.Module(buf)
    return imports ? new WebAssembly.Instance(mod, imports) : mod
  } else {
    return _instantiateOrCompile(buf, imports, false)
  }
}
export { _loadWasmModule };
`;
