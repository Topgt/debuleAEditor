import React from 'react'

const Image: React.FC<any> = (props) => {
  const { blockProps: {src} } = props

  return <img style={{width: '100%'}} src={src}/>
}

export default Image