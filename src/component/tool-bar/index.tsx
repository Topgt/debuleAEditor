import React from 'react'
import {toolbar, Itoolbar} from '../../config/tool-bar-config'
import {IToolBar} from './index.d'
import style from './style.less'

const ToolBar: React.FC<IToolBar> = (props) => {
  const { event, editorState, stack } = props

  const selection = editorState.getSelection()
  const inlineStyles = editorState
    .getCurrentInlineStyle()
    .toJS()
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();
  const blockData = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getData()
    .toJS();

  const renderToolBar = (tools: Itoolbar) => {
    return tools.map((toolbarItem, idx) => {
      if (Array.isArray(toolbarItem)) {
        return renderToolBar(toolbarItem)
      } else {
        const { render } = toolbarItem
        const toolBarState = {
          event,
          stack,
          inlineStyles,
          blockType,
          blockData
        }
        return (<div className={style.barArea} key={idx}>
          {
            typeof render === 'function'
              ? render(toolBarState, toolbarItem, idx, false)
              : null
          }
        </div>)
      }
    })
  }

  return (
    <div
      className={style.editorToolbar}
    >
    {
      renderToolBar(toolbar)
    }
    </div>
  )
}

export default ToolBar
