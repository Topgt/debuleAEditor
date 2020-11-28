import React from 'react'
import className from 'classnames'
import Resizable from './utils/resize'
import style from './style.less'

const Image: React.FC<any> = (props) => {
  const { blockProps: {src} } = props

  const ref = React.useRef(null)
  let resizeController = null

  React.useEffect(() => {
    if (ref !== null) {
      resizeController = new Resizable(ref.current)
    }
    return () => {
      if (resizeController) {
        resizeController.dispose()
      }
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