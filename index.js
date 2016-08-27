new function(){
	if( typeof module == 'object' && typeof require == 'function' ){
		var m = require( 'mithril' )

		module.exports = routeComponent
	}

	const m_route = m.route

	function routeComponent( root, initial, hash ){
		let present
		let previous
		let attrs
		let state
		let resolution
		let redraw

		const wrapper = {
			oninit         : function( vnode ){
				Object.assign( vnode, { attrs, state } )

				if( present.oninit )
					return present.oninit.apply( this, arguments )
			},
			oncreate       : function(){
				if( present.oncreate )
					return present.oncreate.apply( this, arguments )
			},
			onbeforeupdate : function(){
				if( redraw == false ){
					redraw = undefined

					return false
				}

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
				if( previous.onbeforeremove )
					return previous.onbeforeremove.apply( this, arguments )
			},
			onremove       : function(){
				if( previous.onremove )
					return previous.onremove.apply( this, arguments )
			},
		}

		m_route( document.createElement( 'div' ), initial, Object.keys( hash ).reduce( ( output, route ) => {
			const component = hash[ route ]

			output[ route ] = {
				onmatch : function( vnode ){
					{ attrs, state } = vnode

					let guid = resolution = {}

					function resolve( flag ){
						if( guid != resolution )
							return

						previous = present
						present  = component
						resolution = undefined

						redraw = flag

						if( redraw == true )
							m.mount( root, Object.assign( {}, wrapper ) )
					}

					if( !component.onmatch )
						return resolve()

					redraw = component.onmatch( vnode, resolve )

					if( redraw == true )
						m.mount( root, Object.assign( {}, wrapper ) )

				}
			}

			return output
		}, {} ) )

		m.mount( document.createElement( 'div' ), {
			oncreate : () => redraw = undefined,
			onupdate : () => redraw = undefined
		} )

		return m.mount( root, wrapper )
	}
}()