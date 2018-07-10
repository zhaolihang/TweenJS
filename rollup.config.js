// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
export default {
    entry: './src/ts/index.ts',
    format: 'umd',
    plugins: [
        resolve(),
        commonjs(),
        typescript(),
        babel({
            exclude: 'node_modules/**'
        })
    ],
    dest: './dist/index.js',
    moduleName: 'TweenJS',
    sourceMap: true
}