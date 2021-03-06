import React from 'react'
import { EditorState, ContentBlock, RichUtils } from 'draft-js'
import {IpluginProps} from '../plugin.d'
import Image from './image'

export default (props) => {
  const {getCurrentStart, setEditorState, event, editorRef} = props
  return {
    handleKeyCommand: (command, editorState) => {
      let newState;
      switch (command) {
        case 'backspace':
          newState = RichUtils.onBackspace(editorState);
          break
        case 'delete':
          newState = RichUtils.onDelete(editorState);
          break
        default:
          return 'not-handled'
      }
      if (newState != null) {
        setEditorState(newState)
        return 'handled'
      }
      return 'not-handled'
    },
    // 块元素的渲染
    blockRendererFn: (block: ContentBlock ) => {
      if (block.getType() === 'atomic') {
        const contentState = getCurrentStart().getCurrentContent()
        const entity = block.getEntityAt(0)
        if (!entity) return null
        const upDateEntity = (data) => {
          const newContentState = getCurrentStart().getCurrentContent()
          newContentState.mergeEntityData(entity, data)
          let newEditorState = EditorState.createWithContent(newContentState)

          newEditorState = EditorState.forceSelection(
            newEditorState,
            newEditorState.getCurrentContent().getSelectionAfter()
          )
          setEditorState(newEditorState)
        }
        const type = contentState.getEntity(entity).getType()
        const data = contentState.getEntity(entity).getData()
        if (type === 'IMAGE' || type === 'image') {
          const {src, width, height} = data || {}
          return {
            component: Image,
            editable: false,
            props: {
              src,
              width, 
              height,
              upDateEntity,
            }
          }
        }
        return null
      }
      return null
    },
    // 每次变化都会调用，根据不同的key添加不同的className
    blockStyleFn: (contentBlock: ContentBlock) => ''
  }
}
