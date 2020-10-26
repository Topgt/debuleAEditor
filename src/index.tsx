import React from 'react'
import {EditorState, RichUtils} from 'draft-js'
import {Events, Stack, composeDecorators} from './utils/index'
import MyEditor from './editor'
import ToolBar from './component/tool-bar'
import imagePlugin from './plugin/image-plugin'
import focusPlugin from './plugin/focus-plugin'
import {ImyEditor, IToolBar, IeditoRef} from './index.d'
import style from './style.less'
import './global.less'

const Index: React.FC<{}> = () => {
  const state = EditorState.createEmpty()
  const [editorState, setEditorState] = React.useState(state)
  const editorRef = React.useRef((null as IeditoRef))
  const eventRef = React.useRef(new Events())
  const stackRef = React.useRef(new Stack<EditorState>(100, editorState))

  const toolBarProps:IToolBar = {
    editorState,
    stack: stackRef.current,
    event: eventRef.current,
  }

  const blockPlugin =  composeDecorators(focusPlugin, imagePlugin)
  const editorProps: ImyEditor = {
    plugins: [ blockPlugin ],
    event: eventRef.current,
    stack: stackRef.current,
    editorState,
    setEditorState
  }
  return (
    <div
      className={style.page}
    >
      <ToolBar {...toolBarProps} />
      <div className={style.main}>
        <MyEditor ref={editorRef} {...editorProps}/>
      </div>
      
    </div>)
}

export default Index
