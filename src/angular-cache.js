'use strict';

var cacheMain = angular.module('angular-cache-main', [
	'angular-cache-services' ]);
'use strict';

var cacheServices = angular.module('angular-cache-services', ['ngStorage']);

cacheServices.service('cacheConfig', [function() {
	this.configuration = {
		baseApiUrls: [],
		console: false,
		param: 'rev'
	};

	this.setConfiguration = function(config) {
		this.configuration.baseApiUrls = config.baseApiUrls || [];
		this.configuration.console = config.console || false;
		this.configuration.param = config.param || 'rev';	
	};

	this.getConfiguration = function() {
		return this.configuration;
	};
}]);

cacheServices.service('cacheStorage', ['$sessionStorage', 
	function($sessionStorage){

	this.getCache = function () {
		return $sessionStorage.cache || {};
	};

	this.setCache = function (cache) {
		$sessionStorage.cache = cache;
	};	
}]);

cacheServices.service('cacheManager', ['cacheConfig', 'cacheStorage', 
	function(Config, Storage) {

	function isBaseApiUrl(url, strict) {
		var matchingUrls = Config.getConfiguration().baseApiUrls
			.filter(function(baseApiUrl) {
				if (strict && baseApiUrl.strict) {
					return url === baseApiUrl.url;
				} else {
					return url.indexOf(baseApiUrl.url) >= 0;
				}
			});		

		if (matchingUrls && matchingUrls.length > 0) return matchingUrls[0].url;
	}

	function initRevision(cache, key) {
		var rev = 1;

		cache[key] = rev;
		Storage.setCache(cache);

		return rev;
	}

	function incrementRevision(cache, key){
		var currentRev = cache[key];

		if (!currentRev) return;

		cache[key] = Number(currentRev) + 1;

		if (Config.getConfiguration().console)
			console.log('Invalidating cache for ' + key);
	}

	function incrementChildrenRevision(cache, url){
		Object.keys(cache).forEach(function(key) {
			if (key !== url && key.indexOf(url) >= 0)
				incrementRevision(cache, key);
		});
	}

	this.getActualUrl = function(url) {
		var rev, cache;

		if (!isBaseApiUrl(url, true)) 
			return url; // nothing to do, and return the original url

		cache = Storage.getCache();
		rev = cache[url];

		if (!rev) {
			rev = initRevision(cache, url);
		}	

		return url + '?' + Config.getConfiguration().param + '=' + rev;	
	};

	this.invalidateCache = function(method, url) {
		var cache, key, baseApiUrl;

		if (method === 'GET' || method === 'HEAD' || method === 'JSONP' || method === 'OPTIONS')
			return;

		if (!(baseApiUrl = isBaseApiUrl(url)))
			return;

		cache = Storage.getCache();

		incrementRevision(cache, baseApiUrl);

		if (method === 'PUT' || method === 'DELETE') {
			incrementRevision(cache, url);
			incrementChildrenRevision(cache, url + '/');
		}

		Storage.setCache(cache);
	};	

	this.invalidateDescendants = function(url) {
		var cache = Storage.getCache();

		incrementChildrenRevision(cache, url);
		
		Storage.setCache(cache);
	};

}]);

cacheServices.service('cacheRequestInterceptor', ['$cacheFactory', 'cacheManager',
	function($cacheFactory, Manager) {

	function isHtml(url) {
		return url.indexOf('.html') >= 0;
	}

	var cache = $cacheFactory('customCache');

	this.request = function(config) {
		if (config.method === 'GET' && !isHtml(config.url)) {			
			config.cache = cache;
			config.url = Manager.getActualUrl(config.url);
		}			

		return config;         
	};

	this.response = function(response) {
		if (response.config.method === 'POST' || 
			response.config.method === 'PUT' || 
			response.config.method === 'DELETE') {
			Manager.invalidateCache(response.config.method, response.config.url);
		} else if (response.config.method === 'GET' && !isHtml(response.config.url)) {
			cache.remove(response.config.url);
		}			

		return response;
	};
}]);