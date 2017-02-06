import { Map, fromJS } from 'immutable'

const Node = (key, props) => Map({
  key,
  props: fromJS(props), // key - value for all properties
  out: Map(), // key (edgeKey) - value (reference to the edge)
  in: Map() // key (edgeKey) - value (reference to the edge)
})

const Edge = (key, label, start, end, props) => Map({
  key,
  label,
  start,
  end,
  props: fromJS(props)
})

const newLegacyIndex = () => Map({
  nodes: Map(),
  edges: Map()
})

const newEmptyGraph = () => Map({
  nodes: Map(),
  edges: Map(),
  legacyIndex: newLegacyIndex()
})

const Graph = (g) => {

  const _graph = g || newEmptyGraph()

  // hasNode
  const hasNode = (key) => _graph.hasIn(['nodes', key])

  // getNode
  const getNode = (key) => _graph.getIn(['nodes', key])

  // getNodeProp
  const getNodeProp = (key, prop) => _graph.getIn(['nodes', key, 'props', prop])

  const _mergeNode = (g, key, props) => g.hasIn(['nodes', key])
      ? g.mergeIn(['nodes', key, 'props'], props)
      : g.setIn(['nodes', key], Node(key, props))

  // mergeNode
  function mergeNode(key, props){
    return Graph(_mergeNode(_graph, key, props))
  }

  // hasEdge
  const hasEdge = (key) => _graph.hasIn(['edges', key])

  // getEdge
  const getEdge = (key) => _graph.getIn(['edges', key])

  // getEdgeProp
  const getEdgeProp = (key, prop) => _graph
    .getIn(['edges', key, 'props', prop])

  const _mergeEdge = (g, key, props, label, start, end) => {
    const g1 = g.hasIn(['edges', key])
      ? g.mergeIn(['edges', key, 'props'], props)
      : g.setIn(['edges', key], Edge(key, label, start, end, props))

    const g2 = g1
      .setIn(['nodes', start, 'out', key], label)
      .setIn(['nodes', end, 'in', key], label)

    return g2
  }

  // mergeEdge
  function mergeEdge(key, props, label, start, end){
    return Graph(_mergeEdge(_graph, key, props, label, start, end))
  }

  const _deleteNode = (g, key) => g
    .deleteIn(['nodes', key])

  // deleteNode
  function deleteNode(key){
    return Graph(_deleteNode(_graph, key))
  }

  const _deleteEdge = (g, key) => g
    .deleteIn(['edges', key])

  // deleteEdge
  function deleteEdge(key){
    return Graph(_deleteEdge(_graph, key))
  }

  const _addNodeLegacyIndex = (g, legacyIndex, index) => {
    const li = `legacy.${legacyIndex}`
    return g
      .setIn(['legacyIndex', 'nodes', li], index)
      .setIn(['legacyIndex', 'nodes', index], li)
  }

  // addNodeLegacyIndex
  function addNodeLegacyIndex(legacyIndex, index){
    return Graph(_addNodeLegacyIndex(_graph, legacyIndex, index))
  }

  const _addEdgeLegacyIndex = (g, legacyIndex, index) => {
    const li = `legacy.${legacyIndex}`
    return g
      .setIn(['legacyIndex', 'edges', li], index)
      .setIn(['legacyIndex', 'edges', index], li)
  }

  // addEdgeLegacyIndex
  function addEdgeLegacyIndex(legacyIndex, index){
    return Graph(_addEdgeLegacyIndex(_graph, legacyIndex, index))
  }

  // findNodeLegacyIndex
  function findNodeLegacyIndex(legacyIndex){
    const li = `legacy.${legacyIndex}`
    return _graph.getIn(['legacyIndex', 'nodes', li])
  }

  // findEdgeLegacyIndex
  function findEdgeLegacyIndex(legacyIndex){
    const li = `legacy.${legacyIndex}`
    return _graph.getIn(['legacyIndex', 'edges', li])
  }

  // deleteNodeLegacyIndex
  function deleteNodeLegacyIndex(legacyIndex){
    const nodeKey = findNodeLegacyIndex(legacyIndex)
    const li = `legacy.${legacyIndex}`

    const g1 = _graph
      .deleteIn(['legacyIndex', 'nodes', li])
      .deleteIn(['legacyIndex', 'nodes', nodeKey])

    return _deleteNode(g1, nodeKey)
  }

  // deleteEdgeLegacyIndex
  function deleteEdgeLegacyIndex(legacyIndex){
    const edgeKey = findEdgeLegacyIndex(legacyIndex)
    const li = `legacy.${legacyIndex}`

    const g1 = _graph
      .deleteIn(['legacyIndex', 'edges', li])
      .deleteIn(['legacyIndex', 'edges', edgeKey])

    return _deleteEdge(g1, edgeKey)
  }

  // inEKeys
  // in graphgo, that's a node level method, but here it is at the graph level
  const inEKeys = (nodeKey, label) => {
    return _graph.getIn(['nodes', nodeKey, 'in'])
      .filter(
        (edgeLabel, edgeKey) => (edgeLabel === label) && hasEdge(edgeKey)
      )
  }

  // inE
  const inE = (nodeKey, label) => {
    return inEKeys(nodeKey, label)
      .map((edgeLabel, edgeKey) => getEdge(edgeKey))
  }

  // outEKeys
  // in graphgo, that's a node level method, but here it is at the graph level
  const outEKeys = (nodeKey, label) => {
    return _graph.getIn(['nodes', nodeKey, 'out'])
      .filter(
        (edgeLabel, edgeKey) => (edgeLabel === label) && hasEdge(edgeKey)
      )
  }

  // outE
  const outE = (nodeKey, label) => {
    return outEKeys(nodeKey, label)
      .map((edgeLabel, edgeKey) => getEdge(edgeKey))
  }

  // hopKey
  // given an edge and a node, return the other side (key only)
  const hopKey = (edgeKey, nodeKey) => {
    if(!hasEdge(edgeKey)){
      return undefined
    }

    const edge = getEdge(edgeKey)
    switch(nodeKey){
      case edge.get('start'):
        return edge.get('end')
      case edge.get('end'):
        return edge.get('start')
      default:
        return undefined
    }
  }

  // hop
  // given an edge and a node, return the other side
  const hop = (edgeKey, nodeKey) => {
    const otherNodeKey = hopKey(edgeKey, nodeKey)
    if(otherNodeKey === undefined){
      return undefined
    }

    return getNode(otherNodeKey)
  }

  // startN
  const startN = (edgeKey) => {
    if(!hasEdge(edgeKey)){
      return undefined
    }
    const edge = getEdge(edgeKey)

    return getNode(edge.get('start'))
  }

  // endN
  const endN = (edgeKey) => {
    if(!hasEdge(edgeKey)){
      return undefined
    }
    const edge = getEdge(edgeKey)

    return getNode(edge.get('end'))
  }

  // merge
  function merge({nodes, edges}){

    const g1 = Object.keys(nodes).reduce(
      (acc, nodeKey) => {
        const node = nodes[nodeKey]
        return _mergeNode(acc, nodeKey, node['props'])
      },
      _graph
    )

    const g2 = Object.keys(edges).reduce(
      (acc, edgeKey) => {
        const edge = edges[edgeKey]

        return _mergeEdge(
          acc, edgeKey,
          edge['props'], edge['label'],
          edge['start'], edge['end']
        )
      },
      g1
    )

    return Graph(g2)

  }

  function toJS(){
    return _graph.toJS()
  }

  // return
  const graph = () => {
    return g
  }

  return {
    hasNode, getNode, getNodeProp, mergeNode,
    hasEdge, getEdge, getEdgeProp, mergeEdge,
    merge,
    deleteNode, deleteEdge,
    addNodeLegacyIndex, addEdgeLegacyIndex,
    findNodeLegacyIndex, findEdgeLegacyIndex,
    deleteEdgeLegacyIndex, deleteNodeLegacyIndex,
    inEKeys, outEKeys, inE, outE, hopKey, hop, startN, endN,
    graph,
    toJS
  }

}

export default Graph
