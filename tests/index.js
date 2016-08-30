const o         = require( 'mithril/ospec/ospec' )
const mock      = require( 'mithril/test-utils/browserMock' )()
const callAsync = cb => setTimeout( cb, 1000 / 60 )

global.window   = mock
global.document = mock.document

const m = require( 'mithril' )

m.route = require( '../index' )

o.beforeEach( done => {
	window.location.href = ''

	m.mount( document.body, null )

	callAsync( done )
} )

o( 'Generic components run initialisation lifecycle in expected order', done => {
	const component = {
		oninit   : o.spy(),

		view     : o.spy( () =>
			o( component.oninit.callCount ).equals( 1 )
				( 'oninit should have been called once before view' )
		),

		oncreate : o.spy( () =>
			o( component.view.callCount ).equals( 1 )
				( 'view should have been called once before oninit' )
		)
	}

	m.route( document.body, '/', {
		'/' : component
	} )

	callAsync( () => {
		o( component.oncreate.callCount ).equals( 1 )
			( 'oncreate should have been called once' )

		done()
	} )
} )

o( 'New route endpoints diff by default', done => {
	let dom1
	let dom2

	const routes = {
		'/1' : {
			oninit   : o.spy(),

			view     : () => 
				m( 'p' ),

			oncreate : vnode =>
				dom1 = vnode.dom,

			onbeforeremove : o.spy(),
			onremove       : o.spy()
		},

		'/2' : {
			oninit         : o.spy(),
			onbeforeupdate : o.spy(),

			view           : () => 
				m( 'p' ),

			onupdate       : vnode =>
				dom2 = vnode.dom  
		}
	}

	m.route( document.body, '/1', routes )

	callAsync( () => {
		o( routes[ '/1' ].oninit.callCount ).equals( 1 )
			( 'route 1 oninit should have been called once ')

		o.spec( 'upon re-routing', () => {
			m.route.set( '/2' )

			callAsync( () => {
				o( routes[ '/1' ].onbeforeremove.callCount ).equals( 0 )
					( 'route 1 onbeforeremove should not have been called' )

				o( routes[ '/1' ].onremove.callCount       ).equals( 0 )
					( 'route 1 onremove should not have been called' )

				o( routes[ '/2' ].oninit.callCount         ).equals( 0 )
					( 'route 2 oninit should not have been called' )

				o( routes[ '/2' ].onbeforeupdate.callCount ).equals( 1 )
					( 'route 2 onbeforeupdate should have been called once' )

				o( dom1 ).equals( dom2 )
					( 'the vnode dom routes should be the same' )

				done()
			} )
		} )
	} )
} )

o.spec( 'onmatch behaviour', () => {
	o( 'defers route resolution by default', done => {
		const routes = {
			'/' : {
				onmatch : o.spy(),

				oninit  : o.spy(),

				view    : o.spy()
			}
		}

		m.route( document.body, '/', routes )

		callAsync( () => {
			o( routes[ '/' ].onmatch.callCount ).equals( 1 )
				( 'onmatch should have been called once' )
			o( routes[ '/' ].oninit.callCount ).equals( 0 )
				( 'oninit should not have been called' )
			o( routes[ '/' ].view.callCount ).equals( 0 )
				( 'view should not have been called' )

			done()
		} )
	} )

	o( 'calling resolve engages the lifecycle', done => {
		const routes = {
			'/1' : {
				onmatch  : o.spy( ( {}, resolve ) =>
					resolve()
				),

				oninit   : o.spy( () =>
					o( routes[ '/1' ].onmatch.callCount ).equals( 1 )
						( 'onmatch should have been called once before oninit' )
				),

				view     : o.spy( () => 
					m( 'p' )
				)
			},

			'/2' : {
				onmatch        : o.spy( ( {}, resolve ) =>
					resolve()
				),

				onbeforeupdate : o.spy( () =>
					o( routes[ '/2' ].onmatch.callCount ).equals( 1 )
						( 'onbeforeupdate should have been called once before onbeforeupdate' )
				),

				view           : o.spy( () => 
					m( 'p' ) 
				)
			}
		}

		m.route( document.body, '/1', routes )

		callAsync( () => {
			o( routes[ '/1' ].oninit.callCount ).equals( 1 )
				( 'oninit should have been called once' )

			o( routes[ '/1' ].view.callCount ).equals( 1 )
				( 'view should have been called once' )

			o.spec( 'upon re-routing', () => {
				m.route.set( '/2' )

				callAsync( () => {
					o( routes[ '/2' ].onbeforeupdate.callCount ).equals( 1 )
						( 'onbeforeupdate should have been called once, since the onmatch resolved' )

					o( routes[ '/2' ].view.callCount ).equals( 1 )
						( 'view should have been called once, since the onmatch resolved' )

					done()
				} )
			} )
		} )
	} )
} )
