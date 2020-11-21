let m_panel
let m_ctrl
let m_type
// moving鼠标是否按在控制元素，开始拖动；m_start_x/y鼠标相对ctrl的left/top；m_to_y鼠标的新位置
let moving
let [m_start_x, m_start_y, m_to_x, m_to_y] = [0, 0, 0, 0]

const ctrlName = 'resizable-ctrl'

// 为控制元素支持拖拽
function on_mousedown(e:MouseEvent, panelDom, ctrl, type) {
  m_start_x = e.pageX - ctrl.offsetLeft
  m_start_y = e.pageY - ctrl.offsetTop
  m_panel = panelDom
  m_ctrl = ctrl
  m_type = type

  // 开始侦听处理移动事件
  moving = setInterval(on_move, 10)
}

function on_move() {
  // 如果鼠标在移动
  if (moving) {
    // 拖动范围限定，这个限定很不合理！！！，还不如直接设一个最小值呢
    const min_left = m_panel.offsetLeft
    const min_top = m_panel.offsetTop
    let to_x = m_to_x - m_start_x
    let to_y = m_to_y - m_start_y

    to_x = Math.max(to_x, min_left)
    to_y = Math.max(to_y, min_top)

    switch (m_type) {
      case 'r':
        m_ctrl.style.left = `${to_x}px`
        // 加上控制元素的宽度10防止跳动
        m_panel.style.width = `${to_x + 10}px`
        break
      case 'b':
        m_ctrl.style.top = `${to_y}px`
        m_panel.style.height = `${to_y + 10}px`
        break
      case 'rb':
        m_ctrl.style.left = `${to_x}px`
        m_ctrl.style.top = `${to_y}px`
        m_panel.style.width = `${to_x + 20}px`
        m_panel.style.height = `${to_y + 20}px`
        break
      }
  }
}

document.onmousemove = (e: MouseEvent) => {
    m_to_x = e.pageX
    m_to_y = e.pageY
}
document.onmouseup = function() {
    clearInterval(moving)
    moving = false
    // 解决某一边元素动而右下角元素不动的bug
    const cls = document.getElementsByClassName(ctrlName)
    const arr = Array.prototype.slice.call(cls)
    arr.forEach(element => {
      element.style.top = ''
      element.style.left =''
    })
}

// 为面板加入控制元素
function resizable(panelDom: HTMLElement, rName, bName, rbName) {
    var r = document.createElement('div')
    var b = document.createElement('div')
    var rb = document.createElement('div')

    r.className = `${ctrlName} ${rName}`
    b.className = `${ctrlName} ${bName}`
    rb.className = `${ctrlName} ${rbName}`

    panelDom.appendChild(r)
    panelDom.appendChild(b)
    panelDom.appendChild(rb)

    // 为控制元素设置拖拽处理
    r.addEventListener('mousedown', function(e) {
        on_mousedown(e, panelDom, r, 'r')
    })
    b.addEventListener('mousedown', function(e) {
        on_mousedown(e, panelDom, b, 'b')
    })
    rb.addEventListener('mousedown', function(e) {
        on_mousedown(e, panelDom, rb, 'rb')
    })
}

// Resizable(document.getElementById('resizable'))
export default resizable