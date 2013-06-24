(function () {
	'use strict';
	var split = function (eventString) {
		var splitted = eventString.split(':'),
			event = splitted[0],
			path = splitted[1];
//			listeners = path.split('.');
		return [event, path]
	};

	var splitPath = function (path) {
		return path.split('.')
	};

	var joinPaths = function (p1, p2) {
		if (!p1 || !p2) return p1 || p2;
		return p1 + '.' + p2;
	};

	/**
	 *
	 * @param obj Root object
	 * @param path Attribute path e.g. 'user.profile.email'
	 * @param {Boolean} [_wrap=true] Whether to wrap object or not
	 * @returns {*}
	 */
	var get = function (obj, path, _wrap) {
		if(_wrap === void 0) _wrap = true;
		var paths = splitPath(path),
			acc = obj,
			p;
		for (p in paths) {
			path = paths[p];
			acc = acc[path];
			if (!acc) return void 0;
		}
		if(typeof acc === 'object' && _wrap) wrap(acc);
		return acc
	};

	var set = function (obj, path, value) {
		var paths = splitPath(path),
			acc = obj,
			a,
			attrName;
		for (a in paths.slice(0, paths.length - 1)) {
			attrName = paths[a];
			if (!acc[attrName]) acc[attrName] = {};
			acc = acc[attrName];
		}
		acc[paths[paths.length - 1]] = value;
		getBus(obj).trigger('change', path, [value]);
		// iterate over all listeners
		// if their name starts with the given path
		// try to `get` a subpath on the object
		// if it present fire change on that listener
		var o,p;
		for(p in getBus(obj)._listeners){
			if(p.indexOf(path) == 0 && p !== path ){
				o = get(obj, p, false);
				if(o)	getBus(obj).trigger('change', p, [o]);
			}
		}
		return value
	};

	var on = function(obj, eventString, callback, context){
		var splitted = eventString.split(':'),
			event = splitted[0],
			path = splitted[1];
		getBus(obj).on(event, path, callback, context);
	};

	var off = function(obj, eventString, callback, context){
		var splitted = eventString.split(':'),
			event = splitted[0],
			path = splitted[1];
		getBus(obj).off(event, path, callback, context);
	};

	var trigger = function(obj, eventString){
		var splitted = eventString.split(':'),
			event = splitted[0],
			path = splitted[1],
			args = [].splice.call(arguments, 2),
			bus = getBus(obj);
		bus.trigger.call(bus, event, path, args);
	};

	var getPathsTree = function (path) {
		var paths = splitPath(path),
			tree = [],
			acc = '';
		for (var p in paths) {
			path = paths[p];
			acc = joinPaths(acc, path);
			tree.push(acc);
		}
		return tree
	};

	var getBus = function(obj){
		return wrap(obj).__bus__;
	};

	var wrap = function(obj){
		obj.__bus__ || (Object.defineProperty(obj, '__bus__', {
			value: new Bus
		}));
		return obj;
	};

	var Bus = function () {
		// holds listeners and have the following format:
		// 'path':{
		// 	'eventName': {
		// 		listeners:[], // list of callbacks for the given event name
		//		contexts: [] // list of contexts for the matched callbacks
		// 	}
		// }
		// Contexts are matched by index. e.g. if we have a callback stored in `listeners` in N position
		// then the matched context stored in `contexts` in the N position
		this._listeners = {};
	};
	(function () {
		this.on = function (event, path, listener, context) {
			context || (context = this);
			this._listeners[path] || (this._listeners[path] = {});
			this._listeners[path][event] || (this._listeners[path][event] = {listeners: [], contexts: []});
			var eventListeners = this._listeners[path][event].listeners,
				listenersContexts = this._listeners[path][event].contexts,
				i;
			if ((i = eventListeners.indexOf(listener)) > -1 && listenersContexts[i] === context) {
				console.log('event already added');
				return
			}
			eventListeners.push(listener);
			listenersContexts.push(context)
		};
		this.once = function () {};
		this.off = function (eventName, path, listener, context) {
			var subPath = path + '.',
				event,
				events;
			for(var p in this._listeners){
				events = this._listeners[p];
				// iterate over paths that start only with given path
				if(!(p === path || p.indexOf(subPath) == 0)) return;
				for(var e in events){
					if(e !== eventName) continue;
					event = events[e];
					if(listener || context){
						for(var i=0, splices=0, j=0; i<event.listeners.length+splices; i++, j=i-splices){
							if(listener && context){
								if(context === event.contexts[j] && event.listeners[j] === listener){
									event.listeners.splice(j, 1);
									event.contexts.splice(j, 1);
									splices++;
									break
								}
							} else if(context === event.contexts[j] || event.listeners[j] === listener){
								event.listeners.splice(j, 1);
								event.contexts.splice(j, 1);
								splices++;
							}
						}
					} else {
						event.listeners = [];
						event.contexts  = [];
					}
				}
			}
		};
		this.trigger = function (event, path, args) {
			var pathsToWalk = getPathsTree(path);
			for (var p in pathsToWalk) {
				this._triggerCallbacks(pathsToWalk[p], event, args)
			}
		};
		this._triggerCallbacks = function (path, event, args) {
			var pathListener = this._listeners[path];
			if (!pathListener) {
				return
			}
			var eventListeners = this._listeners[path][event].listeners,
				evenContexts = this._listeners[path][event].contexts,
				listener, ctx;
			for (var i = 0; i < eventListeners.length; i++) {
				listener = eventListeners[i];
				ctx = evenContexts[i];
				listener.apply(ctx, args)
			}
		};
	}).call(Bus.prototype);

	window.Bus = {
		get         : get,
		set         : set,
		on          : on,
		off         : off,
		trigger     : trigger,
		getPathsTree: getPathsTree,
		Bus         : Bus
	}
})();