import React from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import Select from '../../component/select'
import Icon from '../../component/icon'

const renderSelect = (toolBarState, toolbarItem, key) => {
  const {event, inlineStyles, blockType, blockData} = toolBarState
  const {action, areas, initValue, lable, icon} = toolbarItem

  let disabled = false
  let currentValue = undefined
  if (lable === '文本和标题') {
    currentValue = blockType
  } else if (lable === '字号') {
    disabled = ['header-one', 'header-two', 'header-three', 'header-four', 'header-five', 'header-six'].includes(blockType)
    currentValue = _.findLast(inlineStyles, style => /^\d{1,2}px$/.test(style)) || initValue
  } else if (lable === '对齐方式') {
    try {
      const textAlign = _.get(blockData, 'textAlign')
      currentValue = textAlign ? JSON.stringify({textAlign}) : initValue
    } catch(e){}
  }
  return (
    <Select 
      disabled={disabled}
      className={classnames({tooltip: !disabled})}
      key={key}
      onChange={(style: string) => event.fire(`${action}`, style)}
      initValue={initValue}
      value={currentValue}
      tooltip={lable}
    >
      {
        areas.map(
          ({icon, lable='', value}, i) => (
            <Select.Option
              key={`${key}-${i}`}
              value={(value as string)}
              lable={
                icon
                  ? icon
                  : <span style={{width: '45px', display: 'inline-block'}} dangerouslySetInnerHTML={{__html: lable.replace(/<[^>]+>/g,"")}} />
              }
            >{
              (v: string, setV: (key: string) => void) => (
                <span
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (value !== v) {
                      setV((value as string))
                    }
                  }}
                >
                  {icon}
                  <span style={{minWidth: '75px', display: 'inline-block', marginLeft: '8px', verticalAlign: 'middle'}} dangerouslySetInnerHTML={{__html: `${lable}`}} />
                  {
                    v === value
                      ? <Icon fontIcon="&#xe61c;" />
                      : ''
                  }
                </span>)
              }
            </Select.Option>))
        }
    </Select>)
}

export default renderSelect
