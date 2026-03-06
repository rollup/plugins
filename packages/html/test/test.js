const { join } = require('path');

const { rollup } = require('rollup');
const css = require('rollup-plugin-postcss');

const { getCode } = require('../../../util/test');
const html = require('..');

// const read = (file = 'index.html') => readFileSync(join('output/', file), 'utf-8');

const output = {
  dir: 'output',
  format: 'umd'
};
process.chdir(join(__dirname, 'fixtures'));
test.sequential('default options', async () => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [html()]
  });
  const code = await getCode(bundle, output, true);
  expect(code).toMatchSnapshot();
});
test.sequential('options', async () => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [
      html({
        fileName: 'batman.html',
        publicPath: 'batcave/',
        title: 'Batcave',
        meta: [
          {
            charset: 'utf-8'
          },
          {
            name: 'viewport',
            content: 'minimum-scale=1, initial-scale=1, width=device-width'
          }
        ]
      })
    ]
  });
  const code = await getCode(bundle, output, true);
  expect(code).toMatchSnapshot();
});
test.sequential('iife', async () => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [html()]
  });
  const code = await getCode(
    bundle,
    {
      dir: 'output',
      format: 'iife'
    },
    true
  );
  expect(code).toMatchSnapshot();
});
test.sequential('esm', async () => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [html()]
  });
  const code = await getCode(
    bundle,
    {
      dir: 'output',
      format: 'es'
    },
    true
  );
  expect(code).toMatchSnapshot();
});
test.sequential('unsupported output format', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'batman.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [html()]
  });
  const code = await getCode(
    bundle,
    {
      dir: 'output',
      format: 'cjs'
    },
    true
  );
  expect(code).toMatchSnapshot();
  expect(warnings).toMatchSnapshot();
});
test.sequential('css', async () => {
  const bundle = await rollup({
    input: 'joker.js',
    plugins: [
      css({
        extract: true
      }),
      html()
    ]
  });
  const code = await getCode(bundle, output, true);
  expect(code).toMatchSnapshot();
});
test.sequential('attributes', async () => {
  const bundle = await rollup({
    input: 'joker.js',
    plugins: [
      css({
        extract: true
      }),
      html({
        attributes: {
          html: {
            batsignal: 'on',
            lang: 'bat'
          },
          link: {
            'data-vilian': 'joker'
          },
          script: {
            defer: true
          }
        }
      })
    ]
  });
  const code = await getCode(bundle, output, true);
  expect(code).toMatchSnapshot();
});
test.sequential('imports', async () => {
  const bundle = await rollup({
    input: 'robin.js',
    plugins: [html()]
  });
  const code = await getCode(bundle, output, true);
  expect(code).toMatchSnapshot();
});
test.sequential('dynamic_imports_not_loaded', async () => {
  const bundle = await rollup({
    input: 'catwoman.js',
    plugins: [html()]
  });
  const code = await getCode(
    bundle,
    {
      dir: 'output',
      format: 'esm'
    },
    true
  );
  expect(code).toMatchSnapshot();
});
test.sequential('template', async () => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [
      html({
        template: () => '<html><body><main></main></body></html>'
      })
    ]
  });
  const code = await getCode(bundle, output, true);
  expect(code).toMatchSnapshot();
});
test.sequential('scripts on head', async () => {
  const bundle = await rollup({
    input: 'joker.js',
    plugins: [
      css({
        extract: true
      }),
      html({
        attributes: {
          script: {
            defer: true
          }
        },
        addScriptsToHead: true
      })
    ]
  });
  const code = await getCode(bundle, output, true);
  expect(code).toMatchSnapshot();
});
