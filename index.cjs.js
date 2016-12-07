var derivatives = [[],[]]

module.exports = map( compose )

function compose( composite ){
  var onmatch
  var oninit
  var rest = {}

  map( function( method, key ){
    if( key === 'oninit' )
      oninit = method

    else if( key === 'onmatch' )
      onmatch = method

    else
      rest[ key ] = method
  } )( composite )

  var component = getSet( derivates, composite, function(){
    return rest
  } )
  var resolver  = {
    render : function( vnode ){
      return [ m( component, vnode.attrs ) ]
    }
  }

  var state     = {}

  if( onmatch )
    resolver.onmatch = function( attrs ){
      return onmatch.call( state, { state : state, attrs : attrs } )
    }

  component.oninit = function( vnode ) {
    vnode.state = state

    state = {}

    if( oninit )
      return oninit.call( vnode.state, vnode )
  }

  return resolver
}

function getSet( arrays, key, factory ){
  var keys   = arrays[ 0 ]
  var values = arrays[ 1 ]
  var index  = arrays.indexOf( key )
  var value

  if( index >= 0 )
    value = values[ index ]

  else {
    value = factory()

    keys.push( key )
    values.push( value )
  }

  return value
}

function map( verb ){
  return function( input ){
    var output = {}

    for( var key in input )
      if( input.hasOwnProperty( key ) )
        output[ key ] = verb( input[ key ], key )

    return output
  }
}
