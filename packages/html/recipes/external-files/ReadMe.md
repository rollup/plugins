This method provides the ability to reference external css/js files for the generated html, and supports adjusting the file loading sequence.

when using it:

```js
import html from '@rollup/plugin-html';
import templateExternalFiles from '@rollup/plugin-html/recipes/external-files';
import postcss from 'rollup-plugin-postcss';

export default [
  {
    input: ['demo/demo.ts'],
    output: [{ file: 'dist/demo.js' }],
    plugins: [
      postcss({
        extract: 'demo.css',
        minimize: false,
        use: ['sass'],
        extensions: ['.scss', '.css']
      }),
      html({
        title: 'sdk demo page',
        publicPath: './',
        fileName: 'demo.html',
        attributes: { html: { lang: 'zh-cn' } },
        template: templateExternalFiles([
          { type: 'js', file: 'example1.js', pos: 'before' },
          { type: 'js', file: 'example2.js', pos: 'before' },
          { type: 'js', file: 'example3.js' },
          { type: 'js', file: 'example4.js', pos: 'before' },
          { type: 'css', file: 'example1.css', pos: 'before' },
          { type: 'css', file: 'example2.css', pos: 'before' },
          { type: 'css', file: 'example3.css' },
          { type: 'css', file: 'example4.css', pos: 'before' }
        ])
      })
    ]
  }
];
```

The content of the generated html file:

```html
<!DOCTYPE html>
<html lang="zh-cn">
  <head>
    <meta charset="utf-8" />
    <title>sdk demo page</title>
    <link href="./example1.css" rel="stylesheet" />
    <link href="./example2.css" rel="stylesheet" />
    <link href="./example4.css" rel="stylesheet" />
    <link href="./demo.css" rel="stylesheet" />
    <link href="./example3.css" rel="stylesheet" />
  </head>
  <body>
    <script src="./example1.js"></script>
    <script src="./example2.js"></script>
    <script src="./example4.js"></script>
    <script src="./demo.js"></script>
    <script src="./example3.js"></script>
  </body>
</html>
```
