import { SelectionState, EditorState } from 'draft-js';

export default (getEditorState, setEditorState, newActiveBlock) => {
  const editorState = getEditorState();

  const offsetKey = `${newActiveBlock.getKey()}-0-0`
  const node = document.querySelectorAll(`[data-offset-key="${offsetKey}"]`)[0]
  //将选择内容设置为节点，这样光标就不会出现在编辑器中闪动
  // selectionState 匹配本机选择
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(node)
  selection.removeAllRanges()
  selection.addRange(range)
  
  const newState = EditorState.forceSelection(
    editorState,
    new SelectionState({
      anchorKey: newActiveBlock.getKey(),
      anchorOffset: 0,
      focusKey: newActiveBlock.getKey(),
      focusOffset: 0,
      isBackward: false,
    })
  )
  setEditorState(newState);
};
