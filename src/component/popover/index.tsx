import React from 'react'
import classnames from 'classnames'
import style from './style.less'

interface Ipopover {
  className?: string
  lable?: string
  tooltip?: string
  icon?: JSX.Element
  children?: any
  disabled?: boolean
}

const Popover: React.FC<Ipopover> = (props) => {
  const { className, lable, icon, children, disabled=false, tooltip} = props
  const popoverRef = React.useRef(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() =>{
    const globalClick = (e: Event) => {
      let target = e.target
      while (target && (target as Element).nodeName !== 'BODY') {
        if (target === popoverRef.current) {
          e.preventDefault()
          return
        }
        target = (target as Element).parentElement
      }
      
      if (!target || (target as Element).nodeName === 'BODY') {
        e.preventDefault()
        setVisible(false)
        return
      }
    }
    if (document.querySelector('body')) {
      (document.querySelector('body') as any).addEventListener('click', globalClick, false)
    }
    return () => {
      if (document.querySelector('body')) {
        (document.querySelector('body') as any).removeEventListener('click', globalClick)
      }
    }
  }, [])
  return (<div
    ref={(ref) => popoverRef.current = ref}
    className={
      classnames(
        className, 
        style.popover, 
        {tooltip: (!disabled && !visible)}
    )}
    disabled={disabled}
    tooltip={tooltip}
    onMouseDown={(e) => {
      e.stopPropagation()
      setVisible(disabled ? false : !visible)
    }}
  >
    {icon }
    <div
      className={style.dropDown}
      style={{
        display: `${visible ? "inline-flex" : "none"}`,
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
    >
      {children}
    </div>
  </div>)
}

export default Popover