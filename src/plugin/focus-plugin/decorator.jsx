import React from 'react'

export default WrappedComponent => 
  (props) => {
    const {blockProps} = props
    const {isFocused, blockKeyStore, setFocusToBlock} = blockProps
    React.useEffect(() => {
      // blockKeyStore.add(props.block.getKey())
      return () => {
        blockKeyStore.remove(props.block.getKey())
      }
    }, [])
    const click = (evt) => {
      evt.preventDefault()
      if (!isFocused()) {
        blockKeyStore.add(props.block.getKey())
        setFocusToBlock(props.block.getKey(), true)
      }
    }

    return (<div
      onClick={click}
      style={{lineHeight: 0}}
    >
      <WrappedComponent
        {...props} 
        onClick={click}
      />
    </div>)
  }