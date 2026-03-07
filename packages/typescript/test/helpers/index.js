const fs = require('fs');

const ts = require('typescript');

const fakeTypescript = (custom) => {
  return {
    sys: ts.sys,
    createModuleResolutionCache: ts.createModuleResolutionCache,
    ModuleKind: ts.ModuleKind,

    transpileModule() {
      return {
        outputText: '',
        diagnostics: [],
        sourceMapText: JSON.stringify({ mappings: '' })
      };
    },

    createWatchCompilerHost() {
      return {
        afterProgramCreate() {}
      };
    },

    createWatchProgram() {
      return {};
    },

    parseJsonConfigFileContent(json, host, basePath, existingOptions) {
      return {
        options: {
          ...json.compilerOptions,
          ...existingOptions
        },
        fileNames: [],
        errors: []
      };
    },

    getOutputFileNames(_, id) {
      return [id.replace(/\.tsx?/, '.js')];
    },

    // eslint-disable-next-line no-undefined
    getTsBuildInfoEmitOutputFilePath: () => undefined,
    ...custom
  };
};

const forceRemove = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // ignore non existant file
  }
};

const waitForWatcherEvent = (watcher, eventCode) =>
  new Promise((resolve, reject) => {
    watcher.on('event', function handleEvent(event) {
      if (event.code === eventCode) {
        watcher.off('event', handleEvent);
        resolve(event);
      } else if (event.code === 'ERROR') {
        watcher.off('event', handleEvent);
        reject(event);
      }
    });
  });

module.exports = { fakeTypescript, forceRemove, waitForWatcherEvent };
