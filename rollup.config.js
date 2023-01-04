import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import banner from 'rollup-plugin-banner';

const preamble = 'iced-defer.js by Jacob Bloom\nThis software is provided as-is, yadda yadda yadda';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './dist/iced-defer.js',
      format: 'iife'
    },
    plugins: [
      typescript(),
      banner(preamble)
    ]
  },
  {
    input: './src/index.ts',
    output: {
      file: './dist/iced-defer.min.js',
      format: 'iife'
    },
    plugins: [
      typescript(),
      terser({ output: { comments: false } }),
      banner(preamble)
    ]
  },
];