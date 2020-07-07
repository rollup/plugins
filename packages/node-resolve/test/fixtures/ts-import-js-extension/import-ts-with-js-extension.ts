import { main } from './main.js';
// This resolves as main.ts and _not_ main.js, despite the extension
const mainResult = main();
export default mainResult;
