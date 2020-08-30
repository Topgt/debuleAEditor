import React from 'react'
import classnames from 'classnames'
import Select from '../select'
import {IareasValue} from '../../config/tool-bar-config'
import Icon from '../icon'
import style from './style.less'

interface IcolorPanel{
  change: (s: string) => void
  disabled: boolean
  areas: IareasValue
  lable?: string
  icon?: JSX.Element
  initValue?: string
  value?: string
}

const ColorPanel: React.FC<IcolorPanel> = (props) => {
  const {disabled, change, areas, lable, icon, value, initValue='#000000'} = props
  const currentValue = value || initValue
  const [selectColor, setColor] = React.useState(currentValue)
  React.useEffect(() => setColor(currentValue), [currentValue])

  const colorLable = (
    <span className={style.lable}>
      {icon}
      <em style={{backgroundColor: selectColor}} />
    </span>)
  return (
    <Select
      disabled={disabled}
      className={classnames({tooltip: !disabled})}
      initValue={initValue}
      value={currentValue}
      onChange={change}
      tooltip={lable}
      lable={colorLable}
    >
      {
        areas.map(({value}, idx) => (
          <Select.Option
            className={style.option}
            key={idx}
          >
            {
              (v: string, setv:(s: string)=>void) => {
                return (value as string[]).map((colorHex, i) => (
                  <span
                    className={style.colorItem}
                    key={`${idx}-${i}`}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if(colorHex !== v) {
                        setv(colorHex)
                        setColor(colorHex)
                      }
                    }}
                  >
                    <span 
                      style={{
                        backgroundColor: colorHex
                      }}
                    />
                    {
                        v === colorHex
                          ? <Icon fontIcon="&#xe61c;" />
                          : ''
                      }
                  </span>
                ))
              }
            }
          </Select.Option>
        ))}
    </Select>
  )
}

export default ColorPanel

