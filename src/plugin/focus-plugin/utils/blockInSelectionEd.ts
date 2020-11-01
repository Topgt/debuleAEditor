import getBlockMapKeys from './getBlockMapKeys'

export default (getCurrentStart, blockKey: string) => {
  const editorState = getCurrentStart()
  const selectionState = editorState.getSelection()
  const contentState = editorState.getCurrentContent()
  
    const selectedBlocksKeys = getBlockMapKeys(
      contentState,
      selectionState.getStartKey(),
      selectionState.getEndKey()
    )

  return selectedBlocksKeys.includes(blockKey);
};