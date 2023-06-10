import { MyComponent } from './MyComponent.jsx';
// This resolves as MyComponent.tsx and _not_ MyComponent.jsx, despite the extension
const componentResult = MyComponent();
export default componentResult;
