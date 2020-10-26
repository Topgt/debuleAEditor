import _ from 'lodash'

export default (...plugins) => 
(params) => {
  const hooks = {}
  plugins.forEach(plugin => {
    const result = typeof plugin === 'function' && plugin(params)
    _.keys(result).forEach(attrName => {
        if (!hooks[attrName]) {
          hooks[attrName] = []
        }
        hooks[attrName].push(result[attrName])
    })
  })
  return hooks
}
