import { statSync } from 'fs';

export default {
  directoryExists(dirPath) {
    try {
      return statSync(dirPath).isDirectory();
    } catch (err) {
      return false;
    }
  },
  fileExists(filePath) {
    try {
      return statSync(filePath).isFile();
    } catch (err) {
      return false;
    }
  }
};
