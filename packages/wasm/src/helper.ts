export const HELPERS_ID = '\0wasmHelpers.js';

export const getHelpersModule = () => `
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

  var buf = null
  var isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null

  if (filepath && isNode) {
    var fs = eval('require("fs")')
    var path = eval('require("path")')

    return new Promise((resolve, reject) => {
      fs.readFile(path.resolve(__dirname, filepath), (error, buffer) => {
        if (error != null) {
          reject(error)
        }

        resolve(_instantiateOrCompile(buffer, imports, false))
      });
    });
  } else if (filepath) {
    return _instantiateOrCompile(fetch(filepath), imports, true)
  }

  if (isNode) {
    buf = Buffer.from(src, 'base64')
  } else {
    var raw = globalThis.atob(src)
    var rawLength = raw.length
    buf = new Uint8Array(new ArrayBuffer(rawLength))
    for(var i = 0; i < rawLength; i++) {
       buf[i] = raw.charCodeAt(i)
    }
  }

  if(sync) {
    var mod = new WebAssembly.Module(buf)
    return imports ? new WebAssembly.Instance(mod, imports) : mod
  } else {
    return _instantiateOrCompile(buf, imports, false)
  }
}
export { _loadWasmModule };
`;
