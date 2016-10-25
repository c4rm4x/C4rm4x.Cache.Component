'use strict';

describe('Cache services', function() {

	beforeEach(module('angular-cache-services'));

	describe('cacheConfig', function() {
		var service;

		beforeEach(inject(function(cacheConfig) {
			service = cacheConfig;
		}));

		describe('getConfiguration', function() {

			it('should return not null configuration', function() {
				expect(service.getConfiguration()).not.toBe(null);
			});

			it('should return a configuration with baseApiUrls property as empty collection', function() {
				expect(service.getConfiguration().baseApiUrls.length).toBe(0);
			});

			it('should return a configuration with a falsy console property', function() {
				expect(service.getConfiguration().console).toBe(false);
			});

			it('should return a configuration with a \'rev\' param property', function() {
				expect(service.getConfiguration().param).toBe('rev');
			});
		});

		describe('setConfiguration', function() {
			var newConfig = {
				baseApiUrls: ['new_base_api_url'],
				console: true,
				param: 'param'
			};

			beforeEach(function() {
				service.setConfiguration(newConfig);
			});

			it('should set configuration baseApiUrls property with new value', function() {
				expect(service.getConfiguration().baseApiUrls).toEqual(newConfig.baseApiUrls);
			});

			it('should set configuration console property with new value', function() {
				expect(service.getConfiguration().console).toBe(newConfig.console);
			});

			it('should set configuration param property with new value', function() {
				expect(service.getConfiguration().param).toBe(newConfig.param);
			});
		});
	});

	describe('cacheStorage', function() {
		var service, $sessionStorage;

		beforeEach(inject(function(cacheStorage, _$sessionStorage_) {
			service = cacheStorage;
			$sessionStorage = _$sessionStorage_;

			if ($sessionStorage.token)
				delete $sessionStorage.token;
		}));	

		describe('getCache', function() {

			it('should return empty object when cache property from $sessionStorage is undefined', function() {
				expect(service.getCache()).not.toBeUndefined();
			});

			it('should return cache property value from $sessionStorage when is defined', function() {
				$sessionStorage.cache = 'anyCache';

				expect(service.getCache()).toBe('anyCache');
			});		
		});

		describe('setCache', function() {

			it('should set new cache as cache property @ $sessionStorage', function() {
				service.setCache('newCache');

				expect($sessionStorage.cache).toBe('newCache');
			});
		});
	});

	describe('cacheManager', function() {
		var service, cacheStorage, cacheConfig,
			baseApiUrl = 'http://localhost:8080/api/resources';

		beforeEach(inject(function(cacheManager, _cacheStorage_, _cacheConfig_) {
			service = cacheManager;
			cacheStorage = _cacheStorage_;
			cacheConfig = _cacheConfig_;

			spyOn(cacheStorage, 'getCache');
			spyOn(cacheStorage, 'setCache');
			spyOn(cacheConfig, 'getConfiguration');

			cacheConfig.getConfiguration.and.returnValue({
				baseApiUrls: [baseApiUrl],
				param: 'rev'
			});
		}));

		describe('getActualUrl', function() {

			describe('not matching url', function() {
				var notMatchingUrl = 'anyUrl';

				it('should not invoke getCache from cacheStorage', function() {				
					expect(cacheStorage.getCache).not.toHaveBeenCalled();
				});

				it('should return same url given as parameter', function() {
					expect(service.getActualUrl(notMatchingUrl)).toBe(notMatchingUrl);
				});
			});

			describe('matching url', function() {
				var matchingUrl = 'http://localhost:8080/api/resources/anyresource';

				it('should invoke getCache from cacheStorage', function() {
					cacheStorage.getCache.and.callThrough();

					service.getActualUrl(matchingUrl);

					expect(cacheStorage.getCache).toHaveBeenCalled();
				});

				describe('no previously requested request', function(){
					var result;

					beforeEach(function() {
						cacheStorage.getCache.and.returnValue({});
						result = service.getActualUrl(matchingUrl)
					});

					it('should save the new state of the cache with the recently added entry', function(){
						expect(cacheStorage.setCache).toHaveBeenCalledWith({
							'http://localhost:8080/api/resources/anyresource': 1,
						});
					});

					it('should return url?param=1 where url is the given as parameter and param is the value of same property @ cacheConfig', function() {
						expect(result).toBe(matchingUrl + '?' + cacheConfig.getConfiguration().param + '=1');
					});
				});

				describe('previously requested resource', function() {
					var result;

					beforeEach(function() {
						cacheStorage.getCache.and.returnValue({
							'http://localhost:8080/api/resources/anyresource': 100
						});
						result = service.getActualUrl(matchingUrl)
					});

					it('should not invoke setCache from cacheStorage', function(){
						expect(cacheStorage.setCache).not.toHaveBeenCalled();
					});

					it('should return url?param=X where url is the given as parameter, X is the state of the cache and param is the value of same property @ cacheConfig', function() {
						expect(result).toBe(matchingUrl + '?' + cacheConfig.getConfiguration().param + '=100');
					});
				});
			});
		});

		describe('invalidateCache', function() {

			describe('Http method GET', function() {
				beforeEach(function() {
					service.invalidateCache('GET');
				});

				it('should not invoke getCache from cacheStorage', function() {				
					expect(cacheStorage.getCache).not.toHaveBeenCalled();
				});

				it('should not invoke setCache from cacheStorage at all', function() {
					expect(cacheStorage.setCache).not.toHaveBeenCalled();
				});
			});	

			describe('Http method HEAD', function() {
				beforeEach(function() {
					service.invalidateCache('HEAD');
				});

				it('should not invoke getCache from cacheStorage', function() {				
					expect(cacheStorage.getCache).not.toHaveBeenCalled();
				});

				it('should not invoke setCache from cacheStorage at all', function() {
					expect(cacheStorage.setCache).not.toHaveBeenCalled();
				});
			});	

			describe('Http method JSONP', function() {
				beforeEach(function() {
					service.invalidateCache('JSONP');
				});

				it('should not invoke getCache from cacheStorage', function() {				
					expect(cacheStorage.getCache).not.toHaveBeenCalled();
				});

				it('should not invoke setCache from cacheStorage at all', function() {
					expect(cacheStorage.setCache).not.toHaveBeenCalled();
				});
			});	

			describe('Http method OPTIONS', function() {
				beforeEach(function() {
					service.invalidateCache('OPTIONS');
				});

				it('should not invoke getCache from cacheStorage', function() {				
					expect(cacheStorage.getCache).not.toHaveBeenCalled();
				});

				it('should not invoke setCache from cacheStorage at all', function() {
					expect(cacheStorage.setCache).not.toHaveBeenCalled();
				});
			});	

			describe('not matching url', function() {
				var notMatchingUrl = 'anyUrl';

				beforeEach(function() {
					service.invalidateCache('POST', notMatchingUrl);
				});

				it('should not invoke getCache from cacheStorage', function() {				
					expect(cacheStorage.getCache).not.toHaveBeenCalled();
				});

				it('should not invoke setCache from cacheStorage at all', function() {
					expect(cacheStorage.setCache).not.toHaveBeenCalled();
				});
			});

			describe('matching url', function() {
				var matchingUrl = 'http://localhost:8080/api/resources/anyresource';			

				describe('Http method POST', function() {
					
					beforeEach(function() {
						cacheStorage.getCache.and.returnValue({
							'http://localhost:8080/api/resources': 100
						});
						service.invalidateCache('POST', baseApiUrl);
					});

					it('should invoke getCache from cacheStorage', function() {				
						expect(cacheStorage.getCache).toHaveBeenCalled();
					});

					it('should invoke setCache from cacheStorage', function() {
						expect(cacheStorage.setCache).toHaveBeenCalled();
					});

					it('should invoke setCache from cacheStorage with the new status which increments the revision of the baseApiUrl', function() {						
						expect(cacheStorage.setCache.calls.mostRecent().args[0][baseApiUrl]).toBe(101);
					});
				});

				describe('Http method PUT', function() {
					
					beforeEach(function() {
						cacheStorage.getCache.and.returnValue({
							'http://localhost:8080/api/resources': 100,
							'http://localhost:8080/api/resources/anyresource': 99,
							'http://localhost:8080/api/resources/anyresource/other': 1,
							'http://localhost:8080/api/resources/anyresources': 20
						});
						service.invalidateCache('PUT', matchingUrl);
					});

					it('should invoke getCache from cacheStorage', function() {				
						expect(cacheStorage.getCache).toHaveBeenCalled();
					});

					it('should invoke setCache from cacheStorage', function() {
						expect(cacheStorage.setCache).toHaveBeenCalled();
					});

					it('should invoke setCache from cacheStorage with the new status which increments the revision of the baseApiUrl', function() {
						expect(cacheStorage.setCache.calls.mostRecent().args[0][baseApiUrl]).toBe(101);
					});

					it('should invoke setCache from cacheStorage with the new status which increments the revision of the resource', function() {
						expect(cacheStorage.setCache.calls.mostRecent().args[0][matchingUrl]).toBe(100);
					});

					it('should invoke setCache from cacheStorage with the new status which increments the revision of all the resources children', function() {
						expect(cacheStorage.setCache.calls.mostRecent().args[0]
							['http://localhost:8080/api/resources/anyresource/other']).toBe(2);
					});

					it('should invoke setCache from cacheStorage with the new status which does not increment the revision of others resources', function() {
						expect(cacheStorage.setCache.calls.mostRecent().args[0]
							['http://localhost:8080/api/resources/anyresources']).toBe(20);
					});
				});

				describe('Http method DELETE', function() {
					
					beforeEach(function() {
						cacheStorage.getCache.and.returnValue({
							'http://localhost:8080/api/resources': 100,
							'http://localhost:8080/api/resources/anyresource': 99,
							'http://localhost:8080/api/resources/anyresource/other': 1,
							'http://localhost:8080/api/resources/anyresources': 20
						});
						service.invalidateCache('DELETE', matchingUrl);
					});

					it('should invoke getCache from cacheStorage', function() {				
						expect(cacheStorage.getCache).toHaveBeenCalled();
					});

					it('should invoke setCache from cacheStorage', function() {
						expect(cacheStorage.setCache).toHaveBeenCalled();
					});

					it('should invoke setCache from cacheStorage with the new status which increments the revision of the baseApiUrl', function() {
						expect(cacheStorage.setCache.calls.mostRecent().args[0][baseApiUrl]).toBe(101);
					});

					it('should invoke setCache from cacheStorage with the new status which increments the revision of the resource', function() {
						expect(cacheStorage.setCache.calls.mostRecent().args[0][matchingUrl]).toBe(100);
					});

					it('should invoke setCache from cacheStorage with the new status which increments the revision of all the resources children', function() {
						expect(cacheStorage.setCache.calls.mostRecent().args[0]
							['http://localhost:8080/api/resources/anyresource/other']).toBe(2);
					});

					it('should invoke setCache from cacheStorage with the new status which does not increment the revision of others resources', function() {
						expect(cacheStorage.setCache.calls.mostRecent().args[0]
							['http://localhost:8080/api/resources/anyresources']).toBe(20);
					});
				});
			});
		});

		describe('invalidateDescendants', function() {
			var matchingUrl = 'http://localhost:8080/api/resources/anyresource/';

			beforeEach(function() {
				cacheStorage.getCache.and.returnValue({
					'http://localhost:8080/api/resources': 100,
					'http://localhost:8080/api/resources/anyresource': 99,
					'http://localhost:8080/api/resources/anyresource/other': 1,
					'http://localhost:8080/api/resources/anyresources': 20
				});				
				service.invalidateDescendants(matchingUrl);
			});

			it('should invoke getCache from cacheStorage', function() {				
				expect(cacheStorage.getCache).toHaveBeenCalled();
			});

			it('should invoke setCache from cacheStorage', function() {
				expect(cacheStorage.setCache).toHaveBeenCalled();
			});

			it('should invoke setCache from cacheStorage with the new status which does not increment the revision of baseApiUrl', function() {
				expect(cacheStorage.setCache.calls.mostRecent().args[0][baseApiUrl]).toBe(100);
			});

			it('should invoke setCache from cacheStorage with the new status which does not increment the revision of url', function() {
				expect(cacheStorage.setCache.calls.mostRecent().args[0]['http://localhost:8080/api/resources/anyresource']).toBe(99);
			});

			it('should invoke setCache from cacheStorage with the new status which increments the revision of all the resources children', function() {
				expect(cacheStorage.setCache.calls.mostRecent().args[0]
					['http://localhost:8080/api/resources/anyresource/other']).toBe(2);
			});

			it('should invoke setCache from cacheStorage with the new status which does not increment the revision of others resources', function() {
				expect(cacheStorage.setCache.calls.mostRecent().args[0]
					['http://localhost:8080/api/resources/anyresources']).toBe(20);
			});
		});
	});

	describe('cacheRequestInterceptor', function() {
		var service, cacheManager, cache;

		beforeEach(inject(function(cacheRequestInterceptor, _cacheManager_, $cacheFactory) {
			service = cacheRequestInterceptor;
			cacheManager = _cacheManager_;
			cache = $cacheFactory.get('customCache');

			spyOn(cacheManager, 'invalidateCache');
			spyOn(cacheManager, 'getActualUrl');	
			spyOn(cache, 'remove')		;
		}));

		describe('request', function() {

			it('should not invoke getActualUrl from cacheManager when Http method is POST', function() {
				service.request({
					method: 'POST'
				});

				expect(cacheManager.getActualUrl).not.toHaveBeenCalled();
			});

			it('should not invoke getActualUrl from cacheManager when Http method is PUT', function() {
				service.request({
					method: 'PUT'
				});

				expect(cacheManager.getActualUrl).not.toHaveBeenCalled();
			});

			it('should not invoke getActualUrl from cacheManager when Http method is DELETE', function() {
				service.request({
					method: 'DELETE'
				});

				expect(cacheManager.getActualUrl).not.toHaveBeenCalled();
			});

			it('should not invoke getActualUrl from cacheManager when Http method is HEAD', function() {
				service.request({
					method: 'HEAD'
				});

				expect(cacheManager.getActualUrl).not.toHaveBeenCalled();
			});

			it('should not invoke getActualUrl from cacheManager when Http method is OPTIONS', function() {
				service.request({
					method: 'OPTIONS'
				});

				expect(cacheManager.getActualUrl).not.toHaveBeenCalled();
			});

			it('should not invoke getActualUrl from cacheManager when Http method is JSONP', function() {
				service.request({
					method: 'JSONP'
				});

				expect(cacheManager.getActualUrl).not.toHaveBeenCalled();
			});

			describe('Http method GET', function() {
				var config = {
					method: 'GET',
					url: 'anyUrl'					
				};

				beforeEach(function() {
					cacheManager.getActualUrl.and.returnValue('otherUrl');
					service.request(config);
				});

				it('should invoke getActualUrl from cacheManager with url property @ config', function() {
					expect(cacheManager.getActualUrl).toHaveBeenCalledWith('anyUrl');
				});

				it('should set url property @ config with the value returned by getActualUrl', function() {
					expect(config.url).toBe('otherUrl');
				});

				it('should set cache property @ cache with the a custom cache', function() {
					expect(config.cache).toEqual(cache);
				});
			});
		});

		describe('response', function(){

			describe('Http method GET', function() {				
				var url = 'anyUrl';

				beforeEach(function() {
					service.response({
						config: {
							method: 'GET',
							url: url
						}
					});
				});				

				it('should not invoke invalidateCache from cacheManager', function() {
					expect(cacheManager.invalidateCache).not.toHaveBeenCalled();
				});

				it('should remove the url from the custom cache', function() {
					expect(cache.remove).toHaveBeenCalledWith(url);
				});
			});

			it('should not invoke invalidateCache from cacheManager when Http method is HEAD', function() {
				service.response({
					config: {
						method: 'OPTIONS'
					}
				});

				expect(cacheManager.invalidateCache).not.toHaveBeenCalled();
			});

			it('should not invoke invalidateCache from cacheManager when Http method is HEAD', function() {
				service.response({
					config: {
						method: 'HEAD'
					}
				});

				expect(cacheManager.invalidateCache).not.toHaveBeenCalled();
			});

			it('should not invoke invalidateCache from cacheManager when Http method is JSONP', function() {
				service.response({
					config: {
						method: 'JSONP'
					}
				});

				expect(cacheManager.invalidateCache).not.toHaveBeenCalled();
			});

			it('should invoke invalidateCache from cacheManager when Http method is POST', function() {
				service.response({
					config: {
						method: 'POST',
						url: 'anyUrl'
					}
				});

				expect(cacheManager.invalidateCache).toHaveBeenCalledWith('POST', 'anyUrl');
			});

			it('should invoke invalidateCache from cacheManager when Http method is PUT', function() {
				service.response({
					config: {
						method: 'PUT',
						url: 'anyUrl'
					}
				});

				expect(cacheManager.invalidateCache).toHaveBeenCalledWith('PUT', 'anyUrl');
			});

			it('should invoke invalidateCache from cacheManager when Http method is DELETE', function() {
				service.response({
					config: {
						method: 'DELETE',
						url: 'anyUrl'
					}
				});

				expect(cacheManager.invalidateCache).toHaveBeenCalledWith('DELETE', 'anyUrl');
			});
		});
	});
});