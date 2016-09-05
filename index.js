if( typeof module == 'object' && typeof require == 'function' ){
	var m = require( 'mithril' )

	module.exports = Object.assign( routeComponents, m.route )
}

const m_route = m.route

function routeComponents( root, initial, hash ){
	let present
	let previous
	let attrs
	let state
	let resolution
	let strategy

	const wrapper = {
		oninit         : function( vnode ){
			Object.assign( vnode, { attrs, state } )

			if( present.oninit )
				return present.oninit.apply( this, arguments )
		},
		oncreate       : function(){
			redraw = undefined
			
			if( present.oncreate )
				return present.oncreate.apply( this, arguments )
		},
		onbeforeupdate : function(){
			if( redraw == false ){
				redraw = undefined

				return false
			}
			
			redraw = undefined

			if( present.onbeforeupdate )
				return present.onbeforeupdate.apply( this, arguments )
		},
		onupdate       : function(){
			if( present.onupdate )
				return present.onupdate.apply( this, arguments )
		},
		view           : function(){
			if( present.view )
				return present.view.apply( this, arguments )
		},
		onbeforeremove : function(){
			if( previous && previous.onbeforeremove )
				return previous.onbeforeremove.apply( this, arguments )
		},
		onremove       : function(){
			if( previous && previous.onremove )
				return previous.onremove.apply( this, arguments )
		},
	}

	const draw = () => {
		if( !present )
			return

		if( strategy == true )
			m.mount( root, Object.assign( {}, wrapper ) )
		
		else if( strategy != false )
			m.mount( root, wrapper )
	}

	m_route( document.createElement( 'div' ), initial, Object.keys( hash ).reduce( ( output, route ) => {
		const component = hash[ route ]

		output[ route ] = {
			onmatch : function( vnode ){
				( { attrs, state } = vnode )

				let guid = resolution = {}

				function resolve( flag ){
					if( guid != resolution )
						return

					previous = present
					present  = component
					resolution = undefined

					strategy = flag

					draw()
				}

				if( !component.onmatch )
					return resolve()

				else if( component.onmatch.length < 2 )
					resolve( component.onmatch( vnode ) )

				else {
					strategy = component.onmatch( vnode, resolve )

					draw()
				}
			}
		}

		return output
	}, {} ) )
}
