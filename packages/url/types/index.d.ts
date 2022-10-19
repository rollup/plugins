import type { FilterPattern } from '@rollup/pluginutils';
import type { Plugin } from 'rollup';

interface RollupUrlOptions {
  // Note: the @default tag below uses the zero-width character joiner "‍" to escape the "*/"
  // https://en.wikipedia.org/wiki/Zero-width_joiner
  /**
   * A picomatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should operate on.
   * By default all files are targeted.
   * @default ['**‍/*.svg', '**‍/*.png', '**‍/*.jp(e)?g', '**‍/*.gif', '**‍/*.webp']
   */
  include?: FilterPattern;
  /**
   * A picomatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should _ignore_.
   * By default no files are ignored.
   */
  exclude?: FilterPattern;
  /**
   * The file size limit for inline files.
   * If a file exceeds this limit, it will be copied to the destination folder and the hashed
   * filename will be provided instead.
   * If `limit` is set to `0` all files will be copied.
   * @default 14336 (14kb)
   */
  limit?: number;
  /**
   * A string which will be added in front of filenames when they are not inlined but are copied.
   * @default ''
   */
  publicPath?: string;
  /**
   * If `false`, will prevent files being emitted by this plugin.
   * This is useful for when you are using Rollup to emit both a client-side and server-side bundle.
   * @default true
   */
  emitFiles?: boolean;
  /**
   * If `emitFiles` is `true`, this option can be used to rename the emitted files.
   *
   * It accepts the following string replacements:
   * - `[hash]` - The hash value of the file's contents
   * - `[name]` - The name of the imported file (without its file extension)
   * - `[extname]` - The extension of the imported file (including the leading `.`)
   * - `[dirname]` - The parent directory name of the imported file (including trailing `/`)
   * @default '[hash][extname]'
   */
  fileName?: string;
  /**
   * When using the `[dirname]` replacement in `fileName`, use this directory as the source
   * directory from which to create the file path rather than the parent directory of the imported file.
   * @default ''
   */
  sourceDir?: string;
  /**
   * The destination dir to copy assets, usually used to rebase the assets according to HTML files.
   * @default ''
   */
  destDir?: string;
}

/**
 * A Rollup plugin which imports files as data-URIs or ES Modules.
 */
export default function url(options?: RollupUrlOptions): Plugin;
