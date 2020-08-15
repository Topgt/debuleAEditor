
import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'
import typescript from 'rollup-plugin-typescript2'
import common from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: './src/index.tsx',
  output: {
    file: './lib/editor.cjs.js',
    format: 'cjs'
  },
  plugins: [
    babel(), 
    typescript(), 
    resolve(), 
    common({
      namedExports: {
        'draft-js': ['Editor', 'DefaultDraftBlockRenderMap', 'SelectionState', 'EditorState', 'AtomicBlockUtils', 'CharacterMetadata', 'Modifier', 'RichUtils', 'convertToRaw'],
        'immutable': ['OrderedSet', 'Map']
      }
    }),
    postcss({
      modules: true,
    })
  ],
  external: ["react"],
  watch: {
    exclude: 'node_modules/**'
  }
}