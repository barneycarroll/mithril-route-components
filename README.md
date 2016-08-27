# Mithril route components

Mithril 1 makes a distinction between RouteResolvers and Components as route endpoints. The Mithril Route Components plugin collapses that distinction. The end result is more control over your routing behaviour.

The plugin stands in for `m.route` and can be used as a patch:

```js
var m = require( 'mithril' )
m.route = require( 'mithril-route-components' )
```

## `onmatch` *as well as* all lifecycle hooks; persistent state

This allows you to create route endpoint components with `onmatch` methods which can interrupt or defer execution, and whose `vnode`'s `attrs` and `state` are persisted to the other lifecycle methods.

## Redraw strategy control

The `onmatch` `resolve` hook no longer accepts a component argument: instead `resolve` always resolves to the current component itself<sup>1</sup>. `resolve` now accepts a redraw strategy flag - the same semantics are followed by the `onmatch` return value: `false` means don't trigger the lifecycle (equivalent to v0.2's `m.redraw.strategy( 'none' )`); `true` means initialise from scratch (`m.redraw.strategy( 'all' )`); otherwise, routes are diffed.

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

That's a lot more code, but it's also a lot more powerful. Mithril Route Components was written largely to address the fact that the default options for deferred resource resolution are too limited. The original example's apparent simplicity makes a lot of assumptions which limit its applicable usefulness: we presume that the previous view (or nothing) should be rendered up until the Home component is loaded, at which point it takes full responsibility. Realistically, this leaves a lot to be desired. What if we want to present an interstitial view while the component is loading? What if we need to pass attributes to the component? What if we want to load data from a webservice instead of (or as well as) a component? What if we want to load several components? What if the deferred component has asynchronous initialisation concerns of its own? None of these scenarios is intuitive with the RouteResolver API. With Route Components, they're all possible <sup>3</sup>, the mechanisms for doing so are consistent, and the API surface needed to do so is fully covered in the example above.

## <sup>2</sup> The extended lifecycle

A Route Component must contain at least a `view` or an `onmatch`, but all the other lifecycle methods are available too. Route Components adopt the Route Resolvers convention that they should diff by default - the effects of which aren't immediately intuitive - but that behaviour is controllable too.

`onmatch` is the only method guaranteed to run, and its contents influence how the rest of the lifecycle is treated:
1. If there is no `onmatch`, or if `onmatch` doesn't return a boolean, the component will render as a diff. This means virtual DOM will be recycled, the previous route component's `onbeforeremove` won't trigger, and neither will `oninit` or `oncreate`. Instead, `onbeforeupdate` & `onupdate` will (and, of course, `view`).
2. If `onmatch` returns `true`, the component won't diff. Thus the previous component will be destroyed and honour its `onbeforeremove`, `oninit` & `oncreate` will fire, and the DOM will be built from scratch.
3. If `onmatch` returns `false`, the previous route's component persists until we `resolve`: if we `resolve( true )`, the behaviour above is followed - by default we will diff as per point 1.

## <sup>3</sup> Code-splitting, redux

These examples use [System JS](https://github.com/systemjs/systemjs) for module loading & [`fetch`](https://github.github.io/fetch/) for web services. In each example, only the Route Component is illustrated - mounting them via the API is implicit.

An interstitial view while the component is loading:

```javascript
{
	onmatch( { state }, resolve ){
		System.import( '/component' ).then( component => {
			Object.assign( state, { component } )

			resolve()
		} )
	},

	view : ( { state : { component } } ) =>
	    component 
	  ? m( component )
	  : m( 'p', 'Loading...' )
}
```

If you want to defer view til resolution, return `false` in `onmatch`:


```javascript
{
	onmatch( { state }, resolve ){
		System.import( '/component' ).then( component => {
			Object.assign( state, { component } )

			resolve()
		} )

		return false
	},

	view : ( { state : { component } } ) =>
	  m( component )
}
```

Pass attributes to the component:

```javascript
{
	onmatch( { state }, resolve ){
		System.import( '/component' ).then( component => {
			Object.assign( state, { component } )

			resolve()
		} )

		return false
	},

	view : ( { state, attrs } ) =>
	  m( state.component, attrs )
}
```

Load data from a webservice as well as a component:

```javascript
{
	onmatch( { state }, resolve ){
		Promise.all( [
			fetch( '/data' ).then( data => 
				Object.assign( state, { data } )
			),

			System.import( '/component' ).then( component =>
				Object.assign( state, { component } )
			)
		] ).then( resolve )

		return false
	},

	view : ( { state : { component, data } } ) =>
	  m( component, { data } )
}
```

^ Note the value of Promise-returning APIs.  

A deferred component with asynchronous initialisation concerns of its own: 

```javascript
{
	onmatch( vnode, resolve ){
		System.import( '/component' ).then( component => {
			Object.assign( vnode.state, { component } )

			component.onmatch( vnode, resolve )
		} )

		return false
	},

	view : ( { state } ) =>
	  m( component, state )
}
```

## Coming soon

Tests, examples