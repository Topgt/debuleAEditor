import React from 'react'
import className from 'classnames'
import resizable from './utils/resize'
import style from './style.less'

const Image: React.FC<any> = (props) => {
  const { blockProps: {src} } = props

  const ref = React.useRef(null)

  React.useEffect(() => {
    if (ref !== null) {
      resizable(ref.current, style.resizableR, style.resizableB, style.resizableRB)
    }
  }, [])

  return <div 
    ref={ref}
    className={className(style.panel)}
  >
    <img style={{width: '100%'}} src={src}/>
    </div>
}

export default Image