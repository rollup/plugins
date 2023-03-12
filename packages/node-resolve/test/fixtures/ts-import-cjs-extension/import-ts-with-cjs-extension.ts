import { main } from './main.cjs';
// This resolves as main.cts and _not_ main.cjs, despite the extension
const mainResult = main();
export default mainResult;
