import { Editor, EditorState } from 'draft-js'
import {Events, Stack} from './utils/index'

declare module 'react' {
  interface HTMLAttributes<T> extends DOMAttributes<T> {
    tabIndex?: number
    tooltip?: string
    active?: string
    disabled?: boolean
  }
}

type IeditoRef = Editor | null

interface ImyEditor {
  event: Events
  stack: Stack<EditorState>
  editorState: EditorState
  plugins: any[]
  setEditorState: (state: EditorState) => void
  onChange?: (state: EditorState) => void
}

interface IToolBar {
  editorState: EditorState
  stack: Stack<EditorState>
  event: Events
}

export {
  ImyEditor,
  IToolBar,
  IeditoRef,
}
