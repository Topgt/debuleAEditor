import React from 'react'

const Image: React.FC<any> = (props) => {
  const { blockProps: {src} } = props

  return <div style={{width: '100%'}}>
    <img style={{width: '100%'}} src={src}/>
    </div>
}

export default Image