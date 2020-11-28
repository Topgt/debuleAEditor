import style from '../style.less'

const rName = style.resizableR
const bName = style.resizableB
const rbName = style.resizableRB

class Resizable {
  private ctrlName = 'resizable-ctrl'

  private m_panel
  private m_ctrl
  private m_type

  private moving
  private m_start_x = 0
  private m_start_y = 0
  private m_to_x = 0
  private m_to_y = 0

  constructor(panelDom) {
    var r = document.createElement('div')
    var b = document.createElement('div')
    var rb = document.createElement('div')

    r.className = `${this.ctrlName} ${rName}`
    b.className = `${this.ctrlName} ${bName}`
    rb.className = `${this.ctrlName} ${rbName}`

    this.m_panel = panelDom

    this.m_panel.appendChild(r)
    this.m_panel.appendChild(b)
    this.m_panel.appendChild(rb)

    // 为控制元素设置拖拽处理
    r.addEventListener('mousedown', (e) => {
      this.on_mousedown(e, panelDom, r, 'r')
    })
    b.addEventListener('mousedown', (e) => {
      this.on_mousedown(e, panelDom, b, 'b')
    })
    rb.addEventListener('mousedown', (e) => {
      this.on_mousedown(e, panelDom, rb, 'rb')
    })

    document.addEventListener('mousemove', this.on_mousemove)
    document.addEventListener('mouseup', this.on_mouseup)
  }

  public dispose () {
    document.removeEventListener('mousemove', this.on_mousemove)
    document.removeEventListener('mouseup', this.on_mouseup)
  }

  private on_mousedown(e:MouseEvent, panelDom, ctrl, type) {
    this.m_start_x = e.pageX - ctrl.offsetLeft
    this.m_start_y = e.pageY - ctrl.offsetTop
    this.m_panel = panelDom
    this.m_ctrl = ctrl
    this.m_type = type
  
    // 开始侦听处理移动事件
    this.moving = setInterval(this.on_move, 10)
  }
  
  private on_move = () => {
    // 如果鼠标在移动
    if (this.moving) {
      // 拖动范围限定，这个限定很不合理！！！，还不如直接设一个最小值呢
      const min_left = this.m_panel.offsetLeft
      const min_top = this.m_panel.offsetTop
      let to_x = this.m_to_x - this.m_start_x
      let to_y = this.m_to_y - this.m_start_y

      to_x = Math.max(to_x, min_left)
      to_y = Math.max(to_y, min_top)

      switch (this.m_type) {
        case 'r':
          this.m_ctrl.style.left = `${to_x}px`
          // 加上控制元素的宽度10防止跳动
          this.m_panel.style.width = `${to_x + 10}px`
          break
        case 'b':
          this.m_ctrl.style.top = `${to_y}px`
          this.m_panel.style.height = `${to_y + 10}px`
          break
        case 'rb':
          this.m_ctrl.style.left = `${to_x}px`
          this.m_ctrl.style.top = `${to_y}px`
          this.m_panel.style.width = `${to_x + 20}px`
          this.m_panel.style.height = `${to_y + 20}px`
          break
      }
    }
  }

  private on_mouseup = (e) => {
    clearInterval(this.moving)
    this.moving = false
    // 解决某一边元素动而右下角元素不动的bug
    const cls = document.getElementsByClassName(this.ctrlName)
    const arr = Array.prototype.slice.call(cls)
    arr.forEach(element => {
      element.style.top = ''
      element.style.left =''
    })
  }

  private on_mousemove = (e: MouseEvent) => {
    this.m_to_x = e.pageX
    this.m_to_y = e.pageY
  }
}

export default Resizable