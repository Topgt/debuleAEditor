import React from 'react'
import { ContentBlock } from 'draft-js'
import {IpluginProps} from '../plugin.d'
import Image from './image'

export default (props) => {
  const {getCurrentStart, setEditorState, event, editorRef} = props
  return {
    blockRendererFn: (block: ContentBlock ) => {
      if (block.getType() === 'atomic') {
        const contentState = getCurrentStart().getCurrentContent()
        const entity = block.getEntityAt(0)
        if (!entity) return null
        const type = contentState.getEntity(entity).getType()
        const data = contentState.getEntity(entity).getData()
        if (type === 'IMAGE' || type === 'image') {
          const {src} = data || {}
          return {
            component: Image,
            editable: false,
            props: {
              src
            },
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
