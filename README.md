# Mithril route components

Mithril 1 makes a distinction between RouteResolvers and Components as route endpoints. The Mithril Route Components plugin collapses that distinction. 

## `onmatch` *as well as* all lifecycle hooks; persistent state

This allows you to create route endpoint components with `onmatch` methods which can interrupt or defer execution, and whose `vnode`'s `attrs` and `state` are persisted to the other lifecycle methods.

## Redraw strategy control

The `resolve` hook no longer accepts a component argument: instead `resolve` always resolves to the current component itself<sup>1</sup>. `resolve` now accepts a redraw strategy flag - the same semantics are followed by the `onmatch` return value: `false` means don't trigger the lifecycle (equivalent to v0.2's `m.redraw.strategy( 'none' )`); `true` means initialise from scratch (`m.redraw.strategy( 'all' )`); otherwise, routes are diffed.

This necessarily changes the semantics of the lifecycle hooks: because we match the RouteResolver behaviour of diffing endpoints by default, this means moving from route A to route B will result in route B's `oninit` not being fired<sup>2</sup>.

## <sup>1</sup> But what about code-splitting?

Removing `resolve`'s ability to consume a component looks like a feature loss - but because we now have `vnode.state` that persists from `onmatch` to the other lifecycle hooks, our options for deferred code resolution are actually improved: we can load and store any number or form of entities (like data from web services, for example), store them on the `vnode.state` object, and `resolve` to let the view acess them.

```javascript
// The simplest way to practically replicate this example in the Mithril documentation:
m.route(document.body, "/", {
    "/": {
        onmatch: function(vnode, resolve) {
            // using Webpack async code splitting
            require(['./Home.js'], resolve)
        },
    },
})

// Is as follows:
routeComponents( document.body, '/', {
	'/' : {
		onmatch : function( vnode, resolve ){
			require( [ './Home.js' ], function( component ){
				vnode.state.component = component

				// Resolving `true` means the draw will be performed from scratch
				resolve( true )
			} )

			// Returning false says the rest of the lifecycle won't be triggered until resolution
			return false
		}
	},

	view : function( vnode ){
		return m( vnode.state.component )
	}
} )
```