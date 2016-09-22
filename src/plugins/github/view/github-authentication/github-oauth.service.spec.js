(function () {
  'use strict';
  /* eslint-disable angular/no-private-call */
  /* eslint-disable angular/timeout-service */

  describe('github.view.githubOauthService - ', function () {
    var that;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      that = $injector.get('github.view.githubOauthService');
    }));

    it('should be defined', function () {
      expect(that).toBeDefined();
    });

    it('should have right properties', function () {
      expect(that.GITHUB_ENDPOINTS).toEqual({
        URL: 'https://github.com',
        API_URL: 'https://api.github.com'
      });
    });

    it('should have right interface', function () {
      expect(that.start).toBeDefined();
      expect(that.cancel).toBeDefined();
    });

    it('#cancel', function () {
      spyOn(that.eventService, '$emit');
      that.cancel();
      expect(that.eventService.$emit).toHaveBeenCalledWith('vcs.OAUTH_CANCELLED');
    });

    it('#start, promise is rejected when event `VCS_OAUTH_CANCELLED` is fired', function () {
      var promise = that.start();
      that.eventService.$emit('vcs.OAUTH_CANCELLED');
      expectRejectedWith(promise, 'VCS_OAUTH_CANCELLED');
    });

    it('#start, promise should be resolve with message {"name": "VCS OAuth - success"}', function (done) {
      var promise = that.start();
      that.$window.postMessage('{"name": "VCS OAuth - success"}', '*');
      setTimeout(function () {
        expectResolveWith(promise, undefined);
        done();
      }, 0);
    });

    it('#start, promise should be rejected with message {"name": "VCS OAuth - failure"}', function (done) {
      var promise = that.start();
      that.$window.postMessage('{"name": "VCS OAuth - failure"}', '*');
      setTimeout(function () {
        expectRejectedWith(promise, undefined);
        done();
      }, 0);
    });

    it('#start, promise should be ignored with other message', function (done) {
      var promise = that.start();
      that.$window.postMessage('{}', '*');
      setTimeout(function () {
        expect(promise.$$state.status).toBe(0);
        done();
      }, 0);
    });
  });

  function expectResolveWith(promise, value) {
    expect(promise.$$state.status).toBe(1);
    expect(promise.$$state.value).toBe(value);
  }

  function expectRejectedWith(promise, value) {
    expect(promise.$$state.status).toBe(2);
    expect(promise.$$state.value).toBe(value);
  }

  /* eslint-enable angular/timeout-service */
  /* eslint-enable angular/no-private-call */

})();
