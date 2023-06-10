import { main } from './main.mjs';
// This resolves as main.mts and _not_ main.mjs, despite the extension
const mainResult = main();
export default mainResult;
