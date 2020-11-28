import React from 'react'
import className from 'classnames'
import Resizable from './utils/resize'
import style from './style.less'

const Image: React.FC<any> = (props) => {
  const { blockProps } = props
  const {src, width, height, upDateEntity} = blockProps

  const widthRef = React.useRef(width)
  const heightRef = React.useRef(height)
  widthRef.current = width
  heightRef.current = height

  const ref = React.useRef(null)
  let resizeController = null

  React.useEffect(() => {
    if (ref !== null) {
      resizeController = new Resizable(ref.current)
      resizeController.move_ed((w, h) => {
        if (w && h && (w !== widthRef.current || h !== heightRef.current)) {
          typeof upDateEntity === 'function' && upDateEntity({width: w, height:h})
        }
      })
    }
    return () => {
      if (resizeController) {
        resizeController.dispose()
        resizeController = null
      }
    }
  }, [])

  const inlineStyle: any = {}
  width && (inlineStyle.width = width)
  height && (inlineStyle.height = height)

  return <div 
    ref={ref}
    className={className(style.panel)}
    style={inlineStyle}
  >
    <img style={{width: '100%'}} src={src}/>
    </div>
}

export default Image