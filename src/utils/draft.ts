import {
  EditorState, 
  AtomicBlockUtils,
  SelectionState,
  ContentBlock,
  CharacterMetadata,
  Modifier
} from 'draft-js'
import {OrderedSet} from 'immutable'
import { defaults } from 'lodash'
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

const addEntity = (editorState: EditorState, url: string, type: string) => {
  const urlType = type.toLocaleUpperCase()
  const contentState = editorState.getCurrentContent()
  const contentStateWithEntity = contentState.createEntity(
    urlType,
    'IMMUTABLE',
    {src: url }
  )
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
  const newEditorState = AtomicBlockUtils.insertAtomicBlock(
    editorState,
    entityKey,
    ' '
  )
  return EditorState.forceSelection(
    newEditorState,
    newEditorState.getCurrentContent().getSelectionAfter()
  )
}

const createFnHooks = (methodName: string, plugins: any[]) => (...newArgs) => {
  if (methodName === 'blockRendererFn') {
    let block: {[key: string]: any} = { props: {} }
    plugins.forEach(plugin => {
      const result = typeof plugin === 'function'
                      ? plugin(...newArgs)
                      : undefined
      if (result !== undefined && result !== null) {
        const { props: pluginProps, ...pluginRest } = result
        const { props, ...rest } = block
        block = {
          ...rest,
          ...pluginRest,
          props: { ...props, ...pluginProps },
        };
      }
    });

    return block.component ? block : false;
  } else if (methodName === 'blockStyleFn') {
    let styles;
    plugins.forEach(plugin => {
      const result = typeof plugin[methodName] === 'function'
                      ? plugin[methodName](...newArgs)
                      : undefined
      if (result !== undefined && result !== null) {
        styles = (styles ? `${styles} ` : '') + result;
      }
    });

    return styles || '';
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
