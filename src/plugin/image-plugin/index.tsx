import React from 'react'
import { ContentBlock } from 'draft-js'
import {IpluginProps} from '../plugin.d'

export default (props) => {
  const {getCurrentStart, setEditorState, event, editorRef} = props
  return {
    blockRendererFn: (block: ContentBlock ) => {
      if (block.getType() === 'atomic') {
        const contentState = getCurrentStart().getCurrentContent()
        const entity = block.getEntityAt(0)
        if (!entity) return null
        const type = contentState.getEntity(entity).getType()
        if (type === 'IMAGE' || type === 'image') {
          return {
            component: () => <img src="http://localhost:8000/static/code-competency-4.527bc81f.png"/>,
            editable: false,
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
