import React from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import Select from '../select'
import Popover from '../popover'
import ColorPanel from '../color-panel'
import Icon from '../icon'
import Input from '../input'
import {IToolBar} from './index.d'
import style from './style.less'
import {toolbarArea, Iarea} from '../../config/tool-bar-config'

const ToolBar: React.FC<IToolBar> = (props) => {
  const { event, editorState, stack } = props

  const inlineStyles = editorState.getCurrentInlineStyle().toJS()
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();
  const blockData = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getData()
    .toJS();

  const renderBtn: (i: Iarea['areas'][0], a: string, k: number | string) => React.ReactNode = (area, action, key) =>{
    const {value, lable} = area
    let active = inlineStyles.includes(value) ? 'true' : 'false'
    let disabled: boolean = false
    if ('撤销' === lable) {
      disabled = stack.isBottom()
      active = `${!disabled}`
    } else if ('重做' === lable) {
      disabled = stack.isTop()
      active = `${!disabled}`
    }
    return (
      <button
        key={key}
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
      </button>
    )
  } 
  const renderToolbarArea: (t: Iarea, idx: number | string)=>React.ReactNode = (area, key) => {
    let disabled = false
    const {action, type, areas, initValue, lable, icon} = area
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
    } else if (lable === '字体颜色') {
      const colorValue = _.findLast(inlineStyles, style => /^color-#\w{6}$/.test(style)) || ''
      const color = colorValue.match(/^color-(#\w{6})$/)
      currentValue = color ? color[1] : initValue
    } else if (lable === '背景色') {
      const colorValue = _.findLast(inlineStyles, style => /^background-#\w{6}$/.test(style)) || ''
      const color = colorValue.match(/^background-(#\w{6})$/)
      currentValue = color ? color[1] : initValue
    }

    switch(type) {
      case 'btn':
        return areas.map((itemArea, idx) => renderBtn(itemArea, action, `${key}-${idx}`))
      case 'select':
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
      case 'color':
      case 'background':
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
      case 'popover': 
          return areas.map(
            ({icon, lable,}, idx) => 
              <Popover 
                key={`${key}-${idx}`} 
                icon={icon} 
                tooltip={lable}
              >
                <Input onBlur={(e) => {
                  const inputText = e.target.value
                  e.target.value = ''
                  event.fire(`${action}`, inputText)
                }} />
              </Popover>
          )
      default :
        return ''
    }
  }
  return (
    <div
      className={style.editorToolbar}
    >
    {
      toolbarArea.map((toolbarArea, idx) => (
        <div className={style.barArea} key={idx}>
          {
            Array.isArray(toolbarArea)
            ? toolbarArea.map((area, i) => renderToolbarArea(area, `${idx}-${i}`))
            : renderToolbarArea(toolbarArea, idx)
          }
        </div>
      ))
    }
    </div>
  )
}

export default ToolBar
