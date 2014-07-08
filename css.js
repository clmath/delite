/** @module delite/css */
/*
 * This includes code from https://github.com/unscriptable/cssx
 * Copyright (c) 2010 unscriptable.com
 */

define([
	"requirejs-dplugins/has",
	"module"
], function (has, module) {
	"use strict";

	/*
	 * AMD css! plugin
	 * This plugin will load and wait for css files.  This could be handy when
	 * loading css files as part of a layer or as a way to apply a run-time theme.
	 * This plugin uses the link load event and a work-around on old webkit browser.
	 * The universal work-around watches a stylesheet until its rules are
	 * available (not null or undefined).
	 *
	 * Global configuration options:
	 *
	 * You may specify an alternate file extension:
	 *
	 *      require("css!myproj/component.less") // --> myproj/component.less
	 *      require("css!myproj/component.scss") // --> myproj/component.scss
	 *
	 * When using alternative file extensions, be sure to serve the files from
	 * the server with the correct mime type (text/css) or some browsers won't
	 * parse them, causing an error in the plugin.
	 *
	 * @example:
	 *      // load and wait for myproj/comp.css
	 *      require(["css!myproj/comp"]);
	 *
	 * Tested in:
	 *      Firefox 28+
	 *      Safari 6+
	 *      Chrome 33+
	 *      IE 9+
	 *      Android 4.x
	 *      Windows Phone 8.x
	 *      iOS 6+
	 */

	var
	// failed is true if RequireJS threw an exception
		failed = false,
		cache = {},
		lastInsertedLink,
	// build variables
		loadList = [],
		writePluginFiles;

	has.add("event-link-onload-api", function (global) {
		var wk = navigator.userAgent.match(/AppleWebKit\/([\d.]+)/);
		return global.document && global.document.createElement("link").onload === null
			// PR: needed for webkit browser (actually iOS 5.x or Android 4.x Stock Browser...)
			&& (!wk || parseInt(wk[1], 10) > 535);
	});

	function createLink() {
		var link = document.createElement("link");
		link.rel = "stylesheet";
		link.type = "text/css";
		return link;
	}

	var loadDetector = function (params, cb) {
		// failure detection
		// we need to watch for onError when using RequireJS so we can shut off
		// our setTimeouts when it encounters an error.
		if (require.onError) {
			require.onError = (function (orig) {
				return function () {
					failed = true;
					orig.apply(this, arguments);
				};
			})(require.onError);
		}

		/***** load-detection functions *****/

		function loadHandler(params, cb) {
			// We're using "readystatechange" because IE and Opera happily support both
			var link = params.link;
			link.onreadystatechange = link.onload = function () {
				if (!link.readyState || link.readyState === "complete") {
					has.add("event-link-onload-api", true, true, true);
					cleanup(params);
					cb(params);
				}
			};
		}

		// alternative path for browser with broken link-onload
		if (!has("event-link-onload-api")) {

			var isLinkReady = function (link) {
				// based on http://www.yearofmoo.com/2011/03/cross-browser-stylesheet-preloading.html
				// webkit's and IE's sheet is null until the sheet is loaded
				var sheet = link.sheet || link.styleSheet;
				if (sheet) {
					var styleSheets = document.styleSheets;
					for (var i = styleSheets.length; i > 0; i--) {
						if (styleSheets[i - 1] === sheet) {
							return true;
						}
					}
				}
			};

			var ssWatcher = function (params, cb) {
				// watches a stylesheet for loading signs.
				if (isLinkReady(params.link)) {
					cleanup(params);
					cb(params);
				} else if (!failed) {
					setTimeout(function () {
						ssWatcher(params, cb);
					}, 25);
				}
			};
		}

		function cleanup(params) {
			var link = params.link;
			link.onreadystatechange = link.onload = null;
		}

		// It would be nice to use onload everywhere, but the onload handler
		// only works in IE and Opera.
		// Detecting it cross-browser is completely impossible, too, since
		// THE BROWSERS ARE LIARS! DON'T TELL ME YOU HAVE AN ONLOAD PROPERTY
		// IF IT DOESN'T DO ANYTHING!
		var loaded;

		function cbOnce() {
			if (!loaded) {
				loaded = true;
				cb(params);
			}
		}

		loadHandler(params, cbOnce);
		if (!has("event-link-onload-api")) {
			ssWatcher(params, cbOnce);
		}
	};

	var buildFunctions = {
		writeConfig: function (write, mid, layerPath, loadList) {
			var cssConf = {
				config: {}
			};
			cssConf.config[mid] = {
				layersMap: {}
			};
			cssConf.config[mid].layersMap[layerPath] = loadList;
			
			// Write css config on the layer
			write("require.config(" + JSON.stringify(cssConf) + ");");
		},

		writeLayer: function (writePluginFiles, CleanCSS, dest, loadList) {
			var result = "";
			loadList.forEach(function (src) {
				result += new CleanCSS({
					relativeTo: "./",
					target: dest
				}).minify("@import url(" + src + ");");
			});
			writePluginFiles(dest, result);
		},

		buildLoadList: function (list, logicalPaths) {
			var paths = logicalPaths.split(/, */);
			paths.forEach(function (path) {
				if (list.indexOf(path) === -1) {
					list.push(path);
				}
			});
		},

		getLayersToLoad: function (layersMap, paths) {
			function normalizeLayersMap(layersMap) {
				var result = {};
				for (var layer in layersMap) {
					layersMap[layer].forEach(function (bundle) {
						result[bundle] = layer;
					});
				}
				return result;
			}

			layersMap = normalizeLayersMap(layersMap);
			paths = paths.split(/, */);
			var layersToLoad = [];
			
			paths = paths.filter(function (path) {
				if (layersMap[path]) {
					layersToLoad.push(layersMap[path]);
					return false;
				}
				return true;
			});
			return paths.concat(layersToLoad).join(",");
		}
	};
	
	/***** finally! the actual plugin *****/
	return {
		/**
		 * Convert relative paths to absolute ones. By default only the first path (in the comma
		 * separated list) is converted.
		 * @private
		 */
		normalize: function (resourceDef, normalize) {
			return resourceDef.split(/, */).map(normalize).join(",");
		},

		/*jshint maxcomplexity: 11*/
		load: function (resourceDef, require, callback, loaderConfig) {
			if (loaderConfig.isBuild) {
				buildFunctions.buildLoadList(loadList, resourceDef);
				callback();
				return;
			}

			var config = module.config();
			if (config.layersMap) {
				resourceDef = buildFunctions.getLayersToLoad(config.layersMap, resourceDef);
			}

			var resources = resourceDef.split(","),
				loadingCount = resources.length;

			// all detector functions must ensure that this function only gets
			// called once per stylesheet!
			function loaded(params) {
				// load/error handler may have executed before stylesheet is
				// fully parsed / processed in Opera, so use setTimeout.
				// Opera will process before the it next enters the event loop
				// (so 0 msec is enough time).
				var cached = cache[params.url];
				cached.s = "loaded";
				var cbs = cached.cbs;
				delete cached.cbs;
				if (cbs) {
					cbs.forEach(function (f) { f(); });
				}
				// if all stylesheets have been loaded, then call the plugin callback
				if (--loadingCount === 0) {
					callback(link.sheet || link.styleSheet);
				}
			}

			for (var i = 0; i < resources.length; i++) {
				resourceDef = resources[i];
				var url = require.toUrl(resourceDef),
					link = createLink(),
					params = {
						link: link,
						url: url
					},
					cached = cache[url];
				if (cached) {
					switch (cached.s) {
					case "loaded":
						loaded(params);
						continue;
					case "injected":
						// if the link has been injected in a previous load() call but not yet loaded,
						// we register the loaded callback of this module to get called when the injected css will be
						// loaded, and process the next resourceDef, if any.
						var f = loaded.bind(this, params);
						cached.cbs ? cached.cbs.push(f) : (cached.cbs = [f]);
						continue;
					}
				}
				cache[params.url] = {s: "injected"};
				// hook up load detector(s)
				loadDetector(params, loaded);
				// go!
				var head = document.head || document.getElementsByTagName("head")[0];
				link.href = url;
				head.insertBefore(link, lastInsertedLink ? lastInsertedLink.nextSibling : head.firstChild);
				lastInsertedLink = link;
			}
		},
		
		writeFile: function (pluginName, resource, require, write) {
			writePluginFiles = write;
		},
		
		onLayerEnd: function (write, data) {
			function getLayerPath() {
				return data.path.replace(/^(?:\.\/)?(([^\/]*\/)*)[^\/]*$/, "$1css/layer.css");
			}

			if (data.name && data.path) {
				var CleanCSS = require("clean-css");
				var dest = getLayerPath();

				// Write layer file
				buildFunctions.writeLayer(writePluginFiles, CleanCSS, dest, loadList);
				// Write css config on the layer
				buildFunctions.writeConfig(write, module.id, dest, loadList);
				// Reset loadList
				loadList = [];
			}
		},
		
		// Expose build functions to be used by delite/theme
		buildFunctions: buildFunctions
	};
});
