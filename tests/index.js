/**/ new function(){ /**/

const o     = require( 'mithril/ospec/ospec' )
const mock  = require( 'mithril/test-utils/browserMock' )()
const steps = ( step1, ...rest ) => new Promise( done => {
	if( rest.length === 0 )
		done()

	else
		setTimeout( () => {
			Promise.resolve( step1 ).then( () => steps( ...rest ) ).then( done )
		}, 1000 / 60 )
} )

global.window   = mock
global.document = mock.document

const m = require( 'mithril' )

const mRC = require( '../index.cjs' )

o.beforeEach( done => {
	m.route( document.body, '/', { '/' : { view : () => '' } } )

	steps( done )
} )

o( 'Route Components run initialisation lifecycle in expected order', done => {
	const Component = {
		onmatch  : o.spy(),
		oninit   : o.spy( () =>
			o( Component.onmatch.callCount ).equals( 1 )
				( 'oninit should have been called once before view' )
		),

		view     : o.spy( () =>
			o( Component.oninit.callCount ).equals( 1 )
				( 'oninit should have been called once before view' )
		),

		oncreate : o.spy( () =>
			o( Component.view.callCount ).equals( 1 )
				( 'view should have been called once before oninit' )
		)
	}

	const RouteComponent = mRC( Component )

	m.route( document.body, '/', {
		'/' : RouteComponent
	} )

	step( () => {
		o( Component.oncreate.callCount ).equals( 1 )
			( 'oncreate should have been called once' )

		done()
	} )
} )

o( 'Vnode attrs & state persist between onmatch and Component lifecycle', done => {
	let attrs
	let state

	const assertion = method => ( vnode, fn ) => {
		o( vnode.attrs ).equals( attrs )
			( 'attrs reference persisted to ' + method )

		o( vnode.state ).equals( state )
			( 'state reference persisted to ' + method )

		o( vnode.state.mutated ).equals( true )
			( 'state mutation persisted to ' + method )

		if( fn )
			return fn( vnode )
	}

	const Component = {
		onmatch  : vnode => {
			attrs = vnode.attrs
			state = vnode.state

			state.mutated = true
		},

		oninit         : o.spy( assert( 'oninit'         ) ),
		oncreate       : o.spy( assert( 'oncreate'       ) ),
		onbeforeupdate : o.spy( assert( 'onbeforeupdate' ) ),
		onupdate       : o.spy( assert( 'onupdate'       ) ),
		onbeforeremove : o.spy( assert( 'onbeforeremove' ) ),
		onremove       : o.spy( assert( 'onremove'       ) ),

		view           : o.spy( assert( 'view', () => '' ) )
	}

	const RouteComponent = mRC( Component )

	m.route( document.body, '/1', {
		'/1' : RouteComponent,
		'/2' : {
			view : () => ''
		}
	} )

	steps(
		() =>
			m.route.set( '/2' ),

		() =>
			Object.keys( Component ).map( key =>
				o( Component[ key ].callCount ).equals( 1 )
			),

		done
	)
} )

o( 'Same Route Component on different routes runs onmatch and sets, but diffs', done => {
	let dom1
	let dom2

	const Component = {
		onmatch        : o.spy(),
		oninit         : o.spy(),
		onbeforeupdate : o.spy(),
		oncreate       : o.spy( vnode => dom1 = vnode.dom ),
		onupdate       : o.spy( vnode => dom2 = vnode.dom ),

		onbeforeremove : o.spy(),
		onremove       : o.spy(),

		view           : o.spy( () => '' ),
	}

	const RouteComponent = mRC( Component )

	const routes = {
		'/1' : RouteComponent,
		'/2' : RouteComponent
	}

	m.route( document.body, '/1', routes )

	steps(
		() =>
			m.route.set( '/2' ),

		() => {
			o( Component.onmatch.callCount ).equals( 1 )
				( 'onmatch should have been called twice' )

			o( Component.oninit.callCount ).equals( 1 )
				( 'onmatch should have been called twice' )

			o( Component.onbeforeupdate.callCount ).equals( 1 )
				( 'onbeforeupdate should have been called once' )

			o( Component.oncreate.callCount ).equals( 1 )
				( 'oncreate should have been called once' )

			o( Component.onupdate.callCount ).equals( 1 )
				( 'onupdate should have been called once' )

			o( Component.onbeforeremove.callCount ).equals( 0 )
				( 'onbeforeremove should not have been called' )

			o( Component.onremove.callCount ).equals( 0 )
				( 'onremove should not have been called ')

			o( Component.view.callCount ).equals( 2 )
				( 'view should have been called twice' )

			o( dom1 ).equals( dom2 )
				( 'the dom node should persist' )
		},

		done
	)
} )

o.run()

/**/ }() /**/
