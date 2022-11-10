import { MinifyOptions } from 'terser';

export interface Options extends MinifyOptions {
  nameCache?: Record<string, any>;
}

export interface WorkerContext {
  code: string;
  options: Options;
}

export interface WorkerContextSerialized {
  code: string;
  options: string;
}

export interface WorkerOutput {
  code: string;
  nameCache?: Options['nameCache'];
}
