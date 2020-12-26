
import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss' // 解析less
import typescript from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve' //解析 node_modules 中的模块
import common from 'rollup-plugin-commonjs' //转换 CJS -> ESM, 通常配合上面一个插件使用
import { terser } from "rollup-plugin-terser"; // 压缩文件
import image from './rollup-plugin/image';

const env = process.env.NODE_ENV

const inputPath = './src/index.tsx'
const outPath = env === 'production' ? './lib' : './example/lib'

const config = [{
  input: inputPath,
  output: {
    file: `${outPath}/editor.cjs.js`,
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
    image(),
    postcss({
      modules: true,
    })
  ],
  external: ["react"],
  watch: {
    exclude: 'node_modules/**'
  }
}, {
  input: inputPath,
  output: {
    file: `${outPath}/editor.esm.js`,
    format: 'esm'
  },
  plugins: [
    image(),
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
}]

if (env === 'production') {
  config.forEach(item => {
    item.plugins.push(
      terser()
    )
  })
}

export default  config