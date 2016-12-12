(function () {
  'use strict';

  describe('github.api - ', function () {
    var that, $httpBackend;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      var apiManager = $injector.get('app.api.apiManager');
      $httpBackend = $injector.get('$httpBackend');
      that = apiManager.retrieve('github.api');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(that).toBeDefined();
    });

    it('should have right properties', function () {
      expect(that.GITHUB_ENDPOINTS).toEqual({
        URL: 'https://github.com',
        API_URL: 'https://api.github.com'
      });
      expect(that.githubApiUrl).toEqual('/pp/v1/vcs/');
    });

    it('should have right interface', function () {
      expect(that.repos).toBeDefined();
      expect(that.branches).toBeDefined();
      expect(that.getBranch).toBeDefined();
      expect(that.commits).toBeDefined();
    });

    it('#_buildRequest()', function () {
      var params = { foo: 'foo' };
      var options = { bar: 'bar' };
      var config = that._buildRequest(params, options);

      expect(config.params).toEqual(params);
      expect(config.headers).toEqual({
        Accept: 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      });

      params = null;
      config = that._buildRequest(params, options);
      expect(config.params).toEqual({});

      options = { headers: { baz: 'baz'} , params: {} };
      config = that._buildRequest(params, options);
      expect(config.headers.baz).toEqual('baz');

      options = null;
      config = that._buildRequest(params, options);

      expect(config).toEqual({
        params: {},
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache'
        }
      });
    });

    it('#repos()', function () {
      $httpBackend.whenGET('/pp/v1/vcs/user/repos').respond({ foo: 'bar' });
      $httpBackend.expectGET('/pp/v1/vcs/user/repos');
      that.repos().then(function (response) {
        expect(response.data).toEqual({ foo: 'bar' });
      });
      $httpBackend.flush();
    });

    it('#branches()', function () {
      $httpBackend.whenGET('/pp/v1/vcs/repos/123/branches').respond({ foo: 'bar' });
      $httpBackend.expectGET('/pp/v1/vcs/repos/123/branches');
      that.branches(123).then(function (response) {
        expect(response.data).toEqual({ foo: 'bar' });
      });
      $httpBackend.flush();
    });

    it('#getBranch()', function () {
      $httpBackend.whenGET('/pp/v1/vcs/repos/123/branches/456').respond({ foo: 'bar' });
      $httpBackend.expectGET('/pp/v1/vcs/repos/123/branches/456');
      that.getBranch(123, 456).then(function (response) {
        expect(response.data).toEqual({ foo: 'bar' });
      });
      $httpBackend.flush();
    });

    it('#commits()', function () {
      $httpBackend.whenGET('/pp/v1/vcs/repos/123/commits').respond({ foo: 'bar' });
      $httpBackend.expectGET('/pp/v1/vcs/repos/123/commits');
      that.commits(123).then(function (response) {
        expect(response.data).toEqual({ foo: 'bar' });
      });
      $httpBackend.flush();
    });
  });
})();
