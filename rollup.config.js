import babel from 'rollup-plugin-babel';

export default {
    entry: 'src/index.js',
    dest: 'dist/index.js',
    format: 'cjs',
    external: [
        'path',
        'eslint',
        'rollup-pluginutils'
    ],
    plugins: [
        babel({
            presets: ['es2015-rollup']
        })
    ]
};
