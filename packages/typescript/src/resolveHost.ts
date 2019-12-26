import { statSync } from 'fs';

import { ModuleResolutionHost } from 'typescript';

export default {
  directoryExists(dirPath: string) {
    try {
      return statSync(dirPath).isDirectory();
    } catch (err) {
      return false;
    }
  },
  fileExists(filePath: string) {
    try {
      return statSync(filePath).isFile();
    } catch (err) {
      return false;
    }
  }
} as ModuleResolutionHost;
