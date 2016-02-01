import babel from 'rollup-plugin-babel';

export default {
    entry: 'src/index.js',
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
