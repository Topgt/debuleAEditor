import React from 'react'
import {EditorState, RichUtils} from 'draft-js'
import {Events, Stack} from './utils/index'
import MyEditor from './my-editor'
import ToolBar from './component/tool-bar'
import {IMyEditor, IToolBar, IeditoRef} from './index.d'
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

  const editorProps: IMyEditor = {
    event: eventRef.current,
    stack: stackRef.current,
    ederiotRef: (editor) => editorRef.current = editor,
    editorState,
    setEditorState
  }
  return (
    <div
      className={style.page}
    >
      <div className="124" />
      <ToolBar {...toolBarProps} />
      <div className={style.main}>
        <MyEditor {...editorProps}/>
      </div>
      
    </div>)
}

export default Index
