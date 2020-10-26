import {
  EditorState, 
  AtomicBlockUtils,
  SelectionState,
  ContentBlock,
  CharacterMetadata,
  Modifier
} from 'draft-js'
import {OrderedSet, OrderedMap} from 'immutable'
import _ from 'lodash'
// const { OrderedSet } = require（'immutable')

const moveSelectionToEnd = (editorState: EditorState) => {
  const content = editorState.getCurrentContent()
  const blockMap = content.getBlockMap()
  const key = blockMap.last().getKey()
  const length = blockMap.last().getLength()
  const selection = new SelectionState({
    anchorKey: key,
    anchorOffset: length,
    focusKey: key,
    focusOffset: length,
  })
  return EditorState.acceptSelection(editorState, selection)
}

const removeBlockStyle:(contentBlock: ContentBlock, rule: RegExp)=>ContentBlock = (contentBlock, rule) => {
  const characterList = contentBlock.getCharacterList()
  const nweCharacterList = characterList.map((character:any) => {
    const inlineStyle = character.getStyle()
    let newCharacter = character
    inlineStyle.forEach((style: string) => {
      if (!!character && !!style && rule.test(style)) {
        newCharacter = CharacterMetadata.removeStyle(newCharacter, style)
      }
    })
    return newCharacter
  })
  const newContentBlock =  contentBlock.set('characterList', nweCharacterList)
  return (newContentBlock as ContentBlock)
}

const removeInlineStyle = (editorState: EditorState, rule: RegExp) => {
  let inlineStyles: string[] = []
  const contentState = editorState.getCurrentContent()
  const selectState = editorState.getSelection()
  const startKey = selectState.getStartKey()
  const endKey = selectState.getEndKey()
  let key = ''
  while(key !== endKey && key !== undefined) {
    key = contentState.getKeyAfter(key || startKey) || startKey
    const block = contentState.getBlockForKey(key || startKey)
    const list = block.getCharacterList()
    list.forEach((d: any) => {
      inlineStyles.push(...d.getStyle().toJS())
    })
  } 

  inlineStyles = [...new Set(inlineStyles)]
  let newContentState = contentState
  inlineStyles.forEach(
    ss => newContentState = rule.test(ss) ? Modifier.removeInlineStyle(newContentState, selectState, ss) : newContentState
  )
  return EditorState.push(editorState, newContentState, 'change-inline-style')
}

const applyInlineStyle = (editorState: EditorState, styles: string[]) => {
  const newEditorState = removeInlineStyle(editorState, /.*/)
  const contentState = newEditorState.getCurrentContent()
  const selectState = newEditorState.getSelection()
  
  let newContentState = contentState
  styles.forEach(
    ss => newContentState = Modifier.applyInlineStyle(newContentState, selectState, ss)
  )
  return EditorState.push(newEditorState, newContentState, 'change-inline-style')
}

const insertText = (editorState: EditorState, text='‎',  styles: string[]) => {
  const inlineStyles:string[] = editorState.getCurrentInlineStyle().toJS()
  const contentState = editorState.getCurrentContent()
  const selectState = editorState.getSelection()
  let draftInlineStyle = OrderedSet<string>(inlineStyles)
  styles.forEach(
    ss => draftInlineStyle = draftInlineStyle.has(ss) ? draftInlineStyle.delete(ss) : draftInlineStyle.add(ss)
  )
  const newContentState = Modifier.insertText(contentState, selectState, text, draftInlineStyle)
  let nextState = EditorState.createWithContent(newContentState)

  const key = selectState.getAnchorKey()
  const length = selectState.getFocusOffset() + text.length
  const nextSelectState = new SelectionState({
    anchorKey: key,
    anchorOffset: length,
    focusKey: key,
    focusOffset: length,
  })
  nextState = EditorState.acceptSelection(nextState, nextSelectState)

  return nextState
}

const addEntity = (editorState: EditorState, atomic: string, type: string) => {
  const urlType = type.toLocaleUpperCase()
  const contentState = editorState.getCurrentContent()
  const contentStateWithEntity = contentState.createEntity(
    urlType,
    'IMMUTABLE',
    {src: atomic }
  )
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
  let newEditorState = AtomicBlockUtils.insertAtomicBlock(
    editorState,
    entityKey,
    `add-${type}`
  )

  const nextContentState = newEditorState.getCurrentContent()
  const blocks = nextContentState.getBlockMap()
  const currentBlock = blocks.find(block => block.getEntityAt(0) === entityKey)
  const breforeBlock = nextContentState.getBlockBefore(currentBlock.getKey())
  // 插入atomic后，会前后出现空行，所以这里如果atomic的前面一行是空行就把他删除
  if (breforeBlock && breforeBlock.getText() === '') {
    const newBlocks = blocks.filter(block => block.getKey() !== breforeBlock.getKey())
    const newContentState = (nextContentState.set('blockMap', newBlocks) as any)
    newEditorState = EditorState.createWithContent(newContentState)
  }
  return EditorState.forceSelection(
    newEditorState,
    newEditorState.getCurrentContent().getSelectionAfter()
  )
}
const renderCompont = {} // 保存 blockRendererFn 的 component，因为如果每次都是新的component会导致第二次getEntityAt获取不到数据
const createFnHooks = (methodName: string, plugins: any[]) => (...newArgs) => {
  if (methodName === 'blockRendererFn') {
    const key = _.get(newArgs, '[0]').getEntityAt(0)
    let block: {[key: string]: any} = { props: {} }
    const initBlock = (plugin, decorators=[]) => {
      const result = typeof plugin === 'function'
            ? plugin(...newArgs)
            : undefined
      if (result !== undefined && result !== null) {
        const { props: pluginProps, createDecorator, ...pluginRest } = result
        createDecorator && decorators.push(createDecorator)
        const { props, ...rest } = block
        block = {
          ...rest,
          ...pluginRest,
          props: { ...props, ...pluginProps },
        };
      }
    }
    plugins.forEach(plugin => {
      if (_.isArray(plugin)) {
        const decorators = []
        plugin.forEach(p => initBlock(p, decorators))
        if (block.component && decorators.length) {
          debugger
          if (!renderCompont[key]) {
            renderCompont[key] = decorators.reduce(
              (component: any, next: any) => next(component), 
              block.component
            )
          }
          block.component = renderCompont[key]
        }
      } else {
        initBlock(plugin)
      }
    });

    return block.component ? block : false;
  } else if (methodName === 'blockStyleFn') {
    let styles;
    const initStyles = (plugin) => {
      const result = typeof plugin[methodName] === 'function'
            ? plugin[methodName](...newArgs)
            : undefined
      if (result !== undefined && result !== null) {
        return result;
      }
    }
    plugins.forEach(plugin => {
      if (_.isArray(plugin)) {
        plugin.forEach(p => {
          styles = (styles ? `${styles} ` : '') + initStyles(p)
        })
      } else {
        styles = (styles ? `${styles} ` : '') + initStyles(plugin)
      }
      
    });

    return styles || '';
  } else if (methodName === 'handleKeyCommand') {
    const bool =  plugins.some(
      plugin => {
        if (_.isArray(plugin)) {
          return plugin.some(p => p(...newArgs) === 'handled')
        } else {
          return plugin(...newArgs) === 'handled'
        }
      }
    ) 

    return bool ? 'handled' : 'not-handled'
  }

  let result
  const wasHandled = plugins.some(plugin => {
    result = typeof plugin[methodName] === 'function'
                ? plugin[methodName](...newArgs)
                : undefined
    return result !== undefined;
  });
  return wasHandled ? result : false
}

export {
  moveSelectionToEnd,
  removeInlineStyle,
  removeBlockStyle,
  applyInlineStyle,
  addEntity,
  insertText,
  createFnHooks
}
