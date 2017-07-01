import assert from 'assert';
import { rollup } from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import eslint from '../';

process.chdir('test');

test('should lint files', () => {
    let count = 0;
    return rollup({
        entry: 'fixtures/undeclared.js',
        plugins: [
            eslint({
                formatter: (results) => {
                    count += results[0].messages.length;
                    const message = results[0].messages[0].message;
                    assert.equal(message, '\'x\' is not defined.');
                }
            })
        ]
    }).then(() => {
        assert.equal(count, 1);
    });
});

test('should not fail with default options', () => {
    return rollup({
        entry: 'fixtures/undeclared.js',
        plugins: [
            eslint()
        ]
    });
});

test('should ignore node_modules with exclude option', () => {
    return rollup({
        entry: 'fixtures/modules.js',
        plugins: [
            nodeResolve({ jsnext: true }),
            eslint({
                configFile: 'fixtures/.eslintrc-babel',
                formatter: () => {
                    assert.fail('should not report any error');
                }
            })
        ]
    });
});

test('should ignore files according .eslintignore', () => {
    return rollup({
        entry: 'fixtures/ignored.js',
        plugins: [
            eslint({
                formatter: () => {
                    assert.fail('should not report any error');
                }
            })
        ]
    });
});

test('should fail with enabled throwError option', () => {
    return rollup({
        entry: 'fixtures/use-strict.js',
        plugins: [
            eslint({
                throwError: true,
                formatter: () => ''
            })
        ]
    }).then(() => {
        assert.fail('should throw error');
    }).catch(err => {
        assert.notEqual(err.toString().indexOf('Warnings or errors were found'), -1);
    });
});

test('should fail with not found formatter', () => {
    assert.throws(() => {
        eslint({ formatter: 'not-found-formatter' });
    }, /There was a problem loading formatter/);
});

test('should not fail with found formatter', () => {
    return rollup({
        entry: 'fixtures/use-strict.js',
        plugins: [
            eslint({
                formatter: 'stylish'
            })
        ]
    });
});
