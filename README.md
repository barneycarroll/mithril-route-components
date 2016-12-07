# Mithril route components [![Build Status](https://travis-ci.org/barneycarroll/mithril-route-components.svg?branch=master)](https://travis-ci.org/barneycarroll/mithril-route-components)

Whereas Mithril v0 allowed a component to handle  [Mithril v1](https://github.com/lhorie/mithril.js/tree/rewrite) makes a distinction between RouteResolvers and Components as route endpoints. The Mithril Route Components plugin collapses that distinction. The end result is more control over your routing behaviour.

|                              | RouteResolver | Component v1 | Component v0 | **Composite**   |
| ---                          | ---           | ---          | ---          | ---             |
| Redirection                  | ✓             |              | ✓            | ✓               |
| Deferred resolution          | ✓             |              | ✓            | ✓               |
| Dynamic content loading      | ✓             |              | ✓            | ✓               |
| Redraw strategy              | ✓             |              | ✓            | ✓<sup>*</sup>   |
| Lifecycle methods            |               | ✓            | ✓            | ✓<sup>*</sup>   |
| Route properties via `attrs` | ✓             |              |              | ✓               |
| Persistent data via `state`  |               | ✓            | *            | ✓               |

```js
var m = require( 'mithril' )
var mRC = require( 'mithril-route-components' )

m.route( document.body, '/', {
	'/' : { onmatch, oninit, onupdate, view, onremove, ...etc }
} )
```

## `onmatch` *as well as* all lifecycle hooks; persistent state

This allows you to create route endpoint components with `onmatch` methods which can interrupt or defer execution, and whose `vnode`'s `attrs` and `state` are persisted to the other lifecycle methods.

## What about `render`?

A RouteComponents *is* actually a RouteResolver which always uses render. Thus if route A and route B both point to the same RouteComponent, `onmatch` will trigger, Mithril will recognize the same component as having *updated*, and act accordingly. The gotcha is that `vnode.state` will not have persisted, since the route - not the vnode - takes precedence in defining state.

## But what about code-splitting?

Removing `resolve`'s ability to consume a component looks like a feature loss - but because we now have `vnode.state` that persists from `onmatch` to the other lifecycle hooks, our options for deferred code resolution are actually improved: we can load and store any number or form of entities (like data from web services, for example), store them on the `vnode.state` object, and `resolve` to let the view acess them.

```javascript
// The simplest way to practically replicate this example in the Mithril documentation:
m.route(document.body, "/", {
    "/": {
        onmatch: function(vnode, resolve) {
            // using Webpack async code splitting
            return require(['./Home.js'])
        },
    },
})

// Is as follows:
m.route( document.body, '/', {
	'/' : mRC( {
		onmatch : function( vnode ){
			return require( [ './Home.js' ], function( component ){
				vnode.state.component = component
			} )
		},

		view : function( vnode ){
			return [ m( vnode.state.component ) ]
		}
	} )
} )
```

That's a lot more code, but it's also a lot more powerful. Mithril Route Components was written largely to address the fact that the default options for deferred resource resolution are too limited. The original example's apparent simplicity makes a lot of assumptions which limit its applicable usefulness: What if we want to load data from a webservice instead of (or as well as) a component? What if we want to load several components? What if the deferred component has asynchronous initialisation concerns of its own? None of these scenarios is intuitive with the RouteResolver API. With Route Components, they're all possible <sup>3</sup>, the mechanisms for doing so are consistent, and the API surface needed to do so is fully covered in the example above.

## The extended lifecycle

A Route Component must contain at least a `view` or an `onmatch`, as well as any number of other vnode lifecycle methods.

## Code-splitting, redux

These examples use [System JS](https://github.com/systemjs/systemjs) for module loading. In each example, only the Route Component is illustrated - mounting them via the API is implicit.

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
