// @ts-check
import typescript from '.';

/** @type {import("rollup").RollupOptions} */
const config = {
    input: 'main.js',
    output: {
        file: 'bundle.js',
        format: 'iife'
    },
    plugins: [
        typescript({
            lib: ["es5", "es6", "dom"],
            target: "es5",
            include: 'node_modules/**',
            exclude: ['node_modules/foo/**', 'node_modules/bar/**', /node_modules/],
        })
    ]
};

export default config;
