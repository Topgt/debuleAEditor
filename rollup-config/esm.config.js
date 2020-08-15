import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: './src/index.tsx',
  output: {
    file: './lib/editor.esm.js',
    format: 'esm'
  },
  plugins: [
    babel(), 
    typescript(), 
    postcss({
      modules: true,
    })
  ],
  external: ['react', 'antd', 'draft-js', 'immutable'],
  watch: {
    exclude: 'node_modules/**'
  }
}