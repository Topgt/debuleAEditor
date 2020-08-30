import React from 'react'
import Immutable from 'immutable'
import _ from 'lodash'
import BlockWrapper from '../component/block-wrapper'
import Icon from '../component/icon'

export type IareasValue = {value: string | string[], icon?: JSX.Element, lable?: string}[]
export interface Iarea {
  action: string
  type: string
  initValue?: string
  lable?: string
  icon?: JSX.Element
  areas: IareasValue
}
export type Iareas = Iarea | Iarea[]
export interface ItoolbarArea {
  map(arg0: (toolbarArea: any, idx: any) => JSX.Element): React.ReactNode
  [i: number]: Iareas
}

// 自定义块状样式的定义，使用toggleInlineStyle更换不同的key
const blockRenderMap = Immutable.Map({
  'unstyled': { // blockType, contentBlock.type
    element: 'div',  // 行标签
    wrapper: <BlockWrapper />,
    // 当Draft解析粘贴的HTML时，它将从HTML元素映射回Draft块类型。如果要指定映射到特定块类型的其他HTML元素，则可以添加aliasedElements数组中。
    aliasedElements: ['p'],
  },
  'header-one': {
    element: 'h1',
    wrapper: <BlockWrapper />
  },
  'header-two': {
    element: 'h2',
    wrapper: <BlockWrapper />
  },
  'header-three': {
    element: 'h3',
    wrapper: <BlockWrapper />
  },
  'header-four': {
    element: 'h4',
    wrapper: <BlockWrapper />
  },
  'header-five': {
    element: 'h5',
    wrapper: <BlockWrapper />
  },
  'header-six': {
    element: 'h6',
    wrapper: <BlockWrapper />
  },
})

// 配色面板的颜色
const colors: IareasValue = [
  {
    value: [
      '#000000', '#262626',
      '#595959', '#8c8c8c',
      '#bfbfbf', '#d9d9d9',
      '#e9e9e9', '#f5f5f5',
      '#fafafa', '#ffffff'
    ]
  },
  {
    value: [
      '#f5222d', '#fa541c',
      '#fa8c16', '#fadb14',
      '#52c41a', '#13c2c2',
      '#1890ff', '#2f54eb',
      '#722ed1', '#eb2f96'
    ]
  },
  {
    value: [
      '#ffe8e6', '#ffece0',
      '#ffefd1', '#fff8bd',
      '#e4f7d2', '#d3f5f0',
      '#d4eefc', '#dee8fc',
      '#efe1fa', '#fae1eb'
    ]
  },
  {
    value: [
      '#ffa39e', '#ffbb96',
      '#ffd591', '#fff08f',
      '#b7eb8f', '#87e8de',
      '#91d5ff', '#adc6ff',
      '#d3adf7', '#ffadd2'
    ]
  },
  {
    value: [
      '#ff4d4f', '#ff7a45',
      '#ffa940', '#ffec3d',
      '#73d13d', '#36cfc9',
      '#40a9ff', '#127ef7',
      '#9254de', '#f759ab'
    ]
  },
  {
    value: [
      '#cf1322', '#d4380d',
      '#d46b08', '#d4b106',
      '#389e0d', '#08979c',
      '#096dd9', '#1d39c4',
      '#531dab', '#c41d7f'
    ]
  },
  {
    value: [
      '#820014', '#871400',
      '#873800', '#614700',
      '#135200', '#00474f',
      '#003a8c', '#061178',
      '#22075e', '#780650'
    ]
  }
]

// tool-bar 配置
export const toolbarArea: ItoolbarArea = [
  {
    action: 'changeEditorState',
    type: 'btn',
    areas: [
      {lable: '保存', icon: <Icon fontIcon="&#xe6fe;" />, value: 'seve'},
      {lable: '撤销', icon: <Icon fontIcon="&#xe629;" />, value: 'undo'},
      {lable: '重做', icon: <Icon fontIcon="&#xe62a;" />, value: 'redo'}
    ]
  }, {
    action: 'format',
    type: 'btn',
    areas: [
      {lable: '格式刷', icon: <Icon fontIcon="&#xe617;" />, value: 'applyStyle'},
      {lable: '清除格式', icon: <Icon fontIcon="&#xe65b;" />, value: 'clearStyle'},
    ]
  }, [{
    action: 'toggleBlockType',
    type: 'select',
    initValue: 'unstyled',
    lable: '文本和标题',
    areas: [
      {lable: '<div style="margin: 0; display: inline-block; min-width: 120px;">正文</div>', value: 'unstyled'},
      {lable: '<h1 style="margin: 0; display: inline-block; min-width: 120px;">标题 1</h1>', value: 'header-one'},
      {lable: '<h2 style="margin: 0; display: inline-block; min-width: 120px;">标题 2</h2>', value: 'header-two'},
      {lable: '<h3 style="margin: 0; display: inline-block; min-width: 120px;">标题 3</h3>', value: 'header-three'},
      {lable: '<h4 style="margin: 0; display: inline-block; min-width: 120px;">标题 4</h4>', value: 'header-four'},
      {lable: '<h5 style="margin: 0; display: inline-block; min-width: 120px;">标题 5</h4>', value: 'header-five'},
      {lable: '<h6 style="margin: 0; display: inline-block; min-width: 120px;">标题 6</h4>', value: 'header-six'},
    ]
  }, {
    action: 'toggleInlineStyle',
    type: 'select',
    initValue: '12px',
    lable: '字号',
    areas: [
      {lable: '12px', value: '12px'},
      {lable: '13px', value: '13px'},
      {lable: '14px', value: '14px'},
      {lable: '15px', value: '15px'},
      {lable: '16px', value: '16px'},
      {lable: '19px', value: '19px'},
      {lable: '22px', value: '22px'},
      {lable: '24px', value: '24px'},
      {lable: '29px', value: '29px'},
      {lable: '32px', value: '32px'},
      {lable: '40px', value: '40px'},
      {lable: '48px', value: '48px'},
    ]
  }], {
    action: 'toggleInlineStyle',
    type: 'btn',
    areas: [
      {lable: '加粗', icon: <Icon fontIcon="&#xe660;" />, value: 'BOLD'},
      {lable: '斜体', icon: <Icon fontIcon="&#xe700;" />, value: 'ITALIC'},
      {lable: '删除线', icon: <Icon fontIcon="&#xe664;" />, value: 'STRIKETHROUGH'},
      {lable: '下划线', icon: <Icon fontIcon="&#xe701;" />, value: 'UNDERLINE'},
      {lable: '更多文本样式', icon: <Icon fontIcon="&#xe632;" />, value: 'dd'},
    ]
  }, [{
    action: 'toggleInlineStyle',
    type: 'color',
    initValue: '#000000',
    lable: '字体颜色',
    icon: <Icon fontIcon="&#xe601;" />,
    areas: colors
  }, {
    action: 'toggleInlineStyle',
    type: 'background',
    initValue: '#ffffff',
    lable: '背景色',
    icon: <Icon fontIcon="&#xe6f8;" />,
    areas: colors
  }],
  {
    action: 'addBlockType',
    type: 'select',
    initValue: JSON.stringify({textAlign: 'left'}),
    lable: '对齐方式',
    areas: [
      {lable: '左对齐', icon: <Icon fontIcon="&#xe6cf;" />, value: JSON.stringify({textAlign: 'left'})},
      {lable: '居中对齐', icon: <Icon fontIcon="&#xe73e;" />, value: JSON.stringify({textAlign: 'center'})},
      {lable: '右对齐', icon: <Icon fontIcon="&#xe6cd;" />, value: JSON.stringify({textAlign: 'right'})},
    ]
  }, 
  {
    action: 'addEntity',
    type: 'btn',
    initValue: JSON.stringify({textAlign: 'left'}),
    areas: [
      {lable: '插入图片', icon: <Icon fontIcon="&#xe64a;" />, value: 'image'},
      {lable: '插入表格', icon: <Icon fontIcon="&#xe6cc;" />, value: JSON.stringify({textAlign: 'center'})},
      {lable: '插入公示', icon: <Icon fontIcon="&#xe600;" />, value: JSON.stringify({textAlign: 'right'})},
    ]
  }
]

// 自定义行内样式的定义，使用toggleInlineStyle更换不同的key
const customStyleMap: {[key:string]: {[key: string]: string}} = {
  '12px': {fontSize: '12px'},
  '13px': {fontSize: '13px'},
  '14px': {fontSize: '14px'},
  '15px': {fontSize: '15px'},
  '16px': {fontSize: '16px'},
  '19px': {fontSize: '19px'},
  '22px': {fontSize: '22px'},
  '24px': {fontSize: '24px'},
  '29px': {fontSize: '29px'},
  '32px': {fontSize: '32px'},
  '40px': {fontSize: '40px'},
  '48px': {fontSize: '48px'},
}

colors.forEach(({value}) => {
  (value as string[]).forEach(s => {
    customStyleMap[`color-${s}`] = {color: s}
    customStyleMap[`background-${s}`] = {background: s}
  })
})

export {customStyleMap, blockRenderMap}
