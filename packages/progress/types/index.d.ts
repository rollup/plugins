import { PluginImpl } from 'rollup';

export interface Options {
  /**
   * If `true`, Each message will overwrite the last one.
   * If `false`, Each message will be displayed on the next line of the last one.
   * @default true
   */
  clearLine?: boolean;
}
/**
 * Display the rollup loading progress.
 */
declare const progress: PluginImpl<Options>;
export default progress;
