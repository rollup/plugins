import { runWorker } from './worker';
import terser from './module';

Promise.resolve().then(() => runWorker());

export * from './type';

export default terser;
