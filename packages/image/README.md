# @rollup/plugin-image

Import JPG, PNG, GIF and SVG files.

## Installation

```bash
npm install --save-dev rollup-plugin-image
```

## Usage

```js
// rollup.config.js
import image from "rollup-plugin-image";

export default {
  entry: "src/index.js",
  dest: "dist/my-lib.js",
  plugins: [image()]
};
```

You can now use images in your bundle like so:

```js
import logo from "./rollup.png";
document.body.appendChild(logo);
```

Images are encoded using base64, which means they will be 33% larger than the size on disk. You should therefore only use this for small images where the convenience of having them available on startup (e.g. rendering immediately to a canvas without co-ordinating asynchronous loading of several images) outweighs the cost.

## License

MIT
