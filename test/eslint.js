import test from 'ava';
import { rollup } from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import eslint from '../';

test('should lint files', t => {
    let count = 0;
    return rollup({
        entry: 'fixtures/undeclared.js',
        plugins: [
            eslint({
                formatter: (results) => {
                    count += results[0].messages.length;
                    const message = results[0].messages[0].message;
                    t.is(message, '\'x\' is not defined.');
                }
            })
        ]
    }).then(() => {
        t.is(count, 1);
    });
});

test('should ignore node_modules with exclude option', t => {
    return rollup({
        entry: 'fixtures/modules.js',
        external: ['path', 'minimatch', 'estree-walker'],
        plugins: [
            nodeResolve({ jsnext: true }),
            eslint({
                configFile: 'fixtures/.eslintrc-babel',
                exclude: '../node_modules/**',
                formatter: () => {
                    t.fail('should not report any error');
                }
            })
        ]
    });
});

test('should ignore files according .eslintignore', t => {
    return rollup({
        entry: 'fixtures/ignored.js',
        plugins: [
            eslint({
                formatter: () => {
                    t.fail('should not report any error');
                }
            })
        ]
    });
});

test('should fail with enabled throwError option', t => {
    return rollup({
        entry: 'fixtures/use-strict.js',
        plugins: [
            eslint({
                throwError: true,
                formatter: () => ''
            })
        ]
    }).then(() => {
        t.fail('should throw error');
    }).catch(err => {
        t.is(err.toString(), 'ESLintError: Warnings or errors were found');
    });
});
