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

interface IMyEditor {
  event: Events
  stack: Stack<EditorState>
  editorState: EditorState
  setEditorState: (state: EditorState) => void
  ederiotRef: (editor:Editor) => Editor
  onChange?: (state: EditorState) => void
}

interface IToolBar {
  editorState: EditorState
  stack: Stack<EditorState>
  event: Events
}

export {
  IMyEditor,
  IToolBar,
  IeditoRef,
}