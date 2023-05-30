import { MyComponent } from './MyComponent.js';
// This resolves as MyComponent.tsx and _not_ MyComponent.js, despite the extension
const componentResult = MyComponent();
export default componentResult;
