const test = require( 'tape' )
const m    = require( 'mithril' )

m.route = require( './index' )

test( 'Matches the m.route signature', test => {
	test.plan( 1 )

	m.route( document.body, '/', {
		'/' : {
			onmatch : ( {}, done ) =>
				done( test.pass( 'resolved a route endpoint' ) )
		}
	} )
} )

test( 'Triggers onmatch, oninit, oncreate and view hooks', test => {
	test.plan( 4 )

	m.route( document.body, '/', {
		'/' : {
			onmatch : ( {}, done ) =>
				done( test.pass( 'onmatch' ) ),

			oninit : () =>
				test.pass( 'oninit' ),

			oncreate : () =>
				test.pass( 'oncreate' ),

			view : () =>
				test.pass( 'onview' )
		}
	} )
} )

test( 'Routed components trigger onbeforeupdate and update', test => {
	test.plan( 2 )

	m.route( document.body, '/', {
		'/' : {
			onbeforeupdate : () =>
				test.pass( 'onbeforeupdate' ),

			onupdate : () =>
				test.pass( 'onupdate' ),

			view : () =>
				setTimeout( m.redraw, 1e3 / 60 )
		}
	} )
} )

test( 'Routed components respect onbeforeupdate flag', test => {
	m.route( document.body, '/', {
		'/' : {
			onbeforeupdate : () =>
				false,

			view : ( { state } ) => {
				if( !state.redrawn )
					test.fail( 'redrawing despite onbeforeupdate return flag' )

				else 
					setTimeout( m.redraw, 1e3 / 60 )

				setTimeout( test.done, 1e3 / 30 )
			}
		}
	} )
} )