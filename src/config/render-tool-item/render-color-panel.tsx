import React from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import ColorPanel from '../../component/color-panel'

const renderColorPanel = (toolBarState, toolbarItem, key) => {
  const {event, inlineStyles, blockType, blockData} = toolBarState
  const {type, action, areas, initValue, lable, icon} = toolbarItem

  let disabled = false
  let currentValue = undefined
  if (lable === '字体颜色') {
    const colorValue = _.findLast(inlineStyles, style => /^color-#\w{6}$/.test(style)) || ''
    const color = colorValue.match(/^color-(#\w{6})$/)
    currentValue = color ? color[1] : initValue
  } else if (lable === '背景色') {
    const colorValue = _.findLast(inlineStyles, style => /^background-#\w{6}$/.test(style)) || ''
    const color = colorValue.match(/^background-(#\w{6})$/)
    currentValue = color ? color[1] : initValue
  }

  return (
    <ColorPanel
      key={key}
      disabled={disabled}
      initValue={initValue}
      value={currentValue}
      change={(s) => event.fire(`${action}`, `${type}-${s}`)}
      areas={areas}
      lable={lable}
      icon={icon}
    />)
}

export default renderColorPanel
