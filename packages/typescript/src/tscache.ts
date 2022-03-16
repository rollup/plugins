import path from 'path';
import fs from 'fs';

/** Creates the folders needed given a path to a file to be saved*/
const createFileFolder = (filePath: string): void => {
  const folderPath = path.dirname(filePath);
  fs.mkdirSync(folderPath, { recursive: true });
};

export default class TSCache {
  private _cacheFolder: string;

  constructor(cacheFolder = '.rollup.cache') {
    this._cacheFolder = cacheFolder;
  }

  /** Returns the path to the cached file */
  cachedFilename(fileName: string): string {
    return path.join(this._cacheFolder, fileName.replace(/^([A-Z]+):/i, '$1'));
  }

  /** Emits a file in the cache folder */
  cacheCode(fileName: string, code: string): void {
    const cachedPath = this.cachedFilename(fileName);
    createFileFolder(cachedPath);
    fs.writeFileSync(cachedPath, code);
  }

  /** Checks if a file is in the cache */
  isCached(fileName: string): boolean {
    return fs.existsSync(this.cachedFilename(fileName));
  }

  /** Read a file from the cache given the output name*/
  getCached(fileName: string): string | undefined {
    let code: string | undefined;
    if (this.isCached(fileName)) {
      code = fs.readFileSync(this.cachedFilename(fileName), { encoding: 'utf-8' });
    }
    return code;
  }
}
