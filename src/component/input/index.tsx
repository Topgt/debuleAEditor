import React from 'react'
import classnames from 'classnames'
import style from './style.less'

const Input: React.ForwardRefRenderFunction<any, any> = (props, ref) => {
  const {className, placeholder, onChange=()=>{}, onBlur=()=>{}, onFocus} = props
  return <input
    ref={ref}
    className={classnames(className, style.input)}
    onChange={onChange}
    onBlur={onBlur}
    onFocus={onFocus}
    placeholder={placeholder}
  />
}

export default React.forwardRef(Input)
