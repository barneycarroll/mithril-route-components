const derivatives = new WeakMap()

export default function compose( composite ){
  const { onmatch, oninit, ...rest } = composite
  const component = getSet( derivates, composite, () => rest )
  const resolver  = {
    render : vnode =>
      [ m( component, vnode.attrs ) ]
  }

  let   state    = {}

  if( onmatch )
    resolver.onmatch = attrs =>
      onmatch.call( state, { state, attrs } )

  component.oninit = vnode => {
    vnode.state = state

    state = {}

    if( oninit )
      return oninit.call( vnode.state, vnode )
  }

  return resolver
}

function getSet( map, key, factory ){
  if( !map.has( key ) )
    map.set( key, factory() )

  return map.get( key )
}
