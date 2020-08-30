import {Editor, EditorState} from 'draft-js'
import {Events} from '../utils/index'

export interface IpluginProps {
  getCurrentStart: () => EditorState
  setEditorState: (start: EditorState) => void
  event: Events
  editorRef: React.MutableRefObject<Editor>
}

