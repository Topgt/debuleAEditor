import React from 'react'
import { ContentBlock, EditorState } from 'draft-js'
import createDecorator from './decorator'
import createBlockKeyStore from './utils/createBlockKeyStore'
import setSelectionToBlock from './utils/setSelectionToBlock'
import blockInSelectionEd from './utils/blockInSelectionEd'
import {IpluginProps} from '../plugin.d'


export default (props) => {
  const {getCurrentStart, setEditorState, event, editorRef} = props

  const blockKeyStore = createBlockKeyStore()
  let lastContentState = undefined
  let lastSelection = undefined

  return {
    // 块元素的渲染
    blockRendererFn: (block: ContentBlock ) => {
      if (block.getType() === 'atomic') {
        const isFocused = () => blockInSelectionEd(getCurrentStart, block.getKey())
        return {
          props: {
            isFocused,
            blockKeyStore,
            setFocusToBlock: () => setSelectionToBlock(getCurrentStart, setEditorState, block),
            isCollapsedSelection: getCurrentStart().getSelection().isCollapsed(),
          },
          createDecorator
        }
      }
      return null
    },
    onChange: (editorState: EditorState) => {
      const contentState = editorState.getCurrentContent()
      /*
        内容没有变化，不需要更新blockRendererFn
      */
      if (!contentState.equals(lastContentState)) {
        lastContentState = contentState
        return editorState
      }
      lastContentState = contentState
      
      // 如果又组件正在focus,则清除foucs 否则不做处理
      const focusableBlockKeys = blockKeyStore.getAll()
      if (focusableBlockKeys && focusableBlockKeys.size) {
        focusableBlockKeys.forEach(key => blockKeyStore.remove(key))
        return EditorState.forceSelection(
          editorState,
          editorState.getSelection()
        )
      }
      return editorState
    },
    // 每次变化都会调用，根据不同的key添加不同的className
    blockStyleFn: (contentBlock: ContentBlock) => ''
  }
}
