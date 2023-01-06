import type { MinifyOptions } from 'terser';

export interface Options extends MinifyOptions {
  nameCache?: Record<string, any>;
  maxWorkers?: number;
}

export interface WorkerContext {
  code: string;
  options: Options;
}

export type WorkerCallback = (err: Error | null, output?: WorkerOutput) => void;

export interface WorkerContextSerialized {
  code: string;
  options: string;
}

export interface WorkerOutput {
  code: string;
  nameCache?: Options['nameCache'];
  sourceMap?: Record<string, any>;
}

export interface WorkerPoolOptions {
  filePath: string;
  maxWorkers?: number;
}

export interface WorkerPoolTask {
  context: WorkerContext;
  cb: WorkerCallback;
}
