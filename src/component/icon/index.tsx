import React from 'react'
import style from './style.less'

interface Iprops {
  fontIcon: string
}

const Icon: React.FC<Iprops> = (props) => {
  const { fontIcon } = props
  return <span className={style.iconfont} dangerouslySetInnerHTML={{__html: `${fontIcon}`}} />
}

export default Icon
