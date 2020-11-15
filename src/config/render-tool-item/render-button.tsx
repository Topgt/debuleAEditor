import React from 'react'
import classnames from 'classnames'
import { IareaItem, IbarItem} from '../../config/tool-bar-config'
import {Events, Stack} from '../../utils/index'

interface IrenderFn {
  (
    toolBarState: {
      event: Events,
      inlineStyles: string[],
      blockType: any,
      blockData: any,
      stack: any
    },
    toolbarItem: IbarItem,
    key: string,
  ): React.ReactNode | React.ReactNode[]
}

const renderBut: IrenderFn = (toolBarState, toolbarItem, key) => {
  const {event, stack, inlineStyles} = toolBarState
  const {action, areas} = toolbarItem
  
  return areas.map((area, idx: number)=> {
    const { value, lable } = area
    let active = inlineStyles.includes(value.toString()) ? 'true' : 'false'
    let disabled: boolean = false
    if ('撤销' === lable) {
      disabled = stack.isBottom()
      active = `${!disabled}`
    } else if ('重做' === lable) {
      disabled = stack.isTop()
      active = `${!disabled}`
    }
    
    return (<button
      key={`${key}-${idx}`}
      disabled={disabled}
      className={classnames({tooltip: !disabled})}
      active={active}
      tooltip={lable}
      onMouseDown={e => {
        e.preventDefault()
        event.fire(`${action}`, value)
      }}
    >
      {area.icon }
    </button>)
  })
}

export default renderBut
