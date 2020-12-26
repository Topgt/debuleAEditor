import React, { useRef } from 'react'
import Popover from '../popover'
import style from './style.less'
import unhighlighted from '../img/unhighlighted.gif'
import highlighted from '../img/highlighted.gif'

export default (toolBarState, toolbarItem, key) => {
  const {event, stack, inlineStyles} = toolBarState
  const {action, areas} = toolbarItem
  const tableRef = useRef(null)
  const [cols, setCols] = React.useState(0)
  const [rows, setRows] = React.useState(0)

  const mouseMove = (evt) => {
    const sideLen = 22
    const el = evt.target || evt.srcElement
    const bcr = el.getBoundingClientRect()

    const offset =  {
      left: evt.clientX - Math.round(bcr.left),
      top: evt.clientY - Math.round(bcr.top)
    };
    const numCols = Math.ceil(offset.left / sideLen)
    const numRows = Math.ceil(offset.top / sideLen)
    if (cols !== numCols || rows !== numRows) {
      setCols(numCols)
      setRows(numRows)
      let style = tableRef.current.querySelector('.overlay').style 
      style.width = numCols * sideLen + "px"
      style.height = numRows * sideLen + "px"

      let labelDom = tableRef.current.querySelector('.edui-label') || {}
      labelDom.innerHTML = `${numCols} 列 x ${numRows} 行`
    }
  }

  return areas.map(
    ({icon, lable,}, idx) => 
      <Popover 
        key={`${key}-${idx}`} 
        icon={icon} 
        tooltip={lable}
      >
        <div className={style.tablepicker} ref={tableRef}>
          <div className={style.body}>
            <div className={style.infoarea}>
              <span className="edui-label"></span>
            </div>
            <div className={style.pickarea}
              style={{backgroundImage: `url(${unhighlighted})`}}
              onMouseMove={mouseMove}
              // onclick="$$._onClick(event, this);"
            >
              <div className="overlay" style={{backgroundImage: `url(${highlighted})`}}></div>
            </div>
          </div>
        </div>
      </Popover>
  )
}