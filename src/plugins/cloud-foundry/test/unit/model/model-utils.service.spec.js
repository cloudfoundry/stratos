(function () {
  'use strict';

  describe('cloud-foundry model utils service', function () {
    var $httpBackend, modelUtils;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      modelUtils = $injector.get('modelUtils');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('makeHttpConfig', function () {
      var cnsiGuid = '12345';
      expect(modelUtils.makeHttpConfig(cnsiGuid)).toEqual({
        headers: {
          'x-cnap-cnsi-list': cnsiGuid,
          'x-cnap-passthrough': 'true'
        }
      });
    });

    it('makeListParams - no params', function () {
      var output = {
        'results-per-page': 100
      };
      expect(modelUtils.makeListParams()).toEqual(output);
    });

    it('makeListParams - some params', function () {
      var input = {
        param1: 'value1',
        param2: 'value2'
      };
      var output = {
        param1: 'value1',
        param2: 'value2',
        'results-per-page': 100
      };
      expect(modelUtils.makeListParams(input)).toEqual(output);
    });

    it('makeListParams - overwrite results per page', function () {
      var input = {
        'results-per-page': 1
      };
      expect(modelUtils.makeListParams(input)).toEqual(input);
    });

    it('dePaginate - 1 page', function () {
      var firstPage = {
        resources: [ 1, 2, 3, 4],
        next_url: undefined
      };
      modelUtils.dePaginate(firstPage).then(function (result) {
        expect(result).toEqual(firstPage.resources);
      });
    });

    it('dePaginate - 5 page', function () {
      var url = 'test?thisIsAnotherParam=abc&page=';
      var firstPage = {
        resources: [ 1, 2, 3, 4],
        next_url: url + 2,
        total_pages: 5
      };
      $httpBackend.expectGET('/pp/v1/proxy' + url + 2).respond(200, {
        resources: [ 5, 6, 7, 8]
      });
      $httpBackend.expectGET('/pp/v1/proxy' + url + 3).respond(200, {
        resources: [ 9, 10, 11, 12]
      });
      $httpBackend.expectGET('/pp/v1/proxy' + url + 4).respond(200, {
        resources: [ 13, 14, 15, 16]
      });
      $httpBackend.expectGET('/pp/v1/proxy' + url + 5).respond(200, {
        resources: [ 17, 18, 19, 20]
      });
      modelUtils.dePaginate(firstPage).then(function (result) {
        expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
      });
      $httpBackend.flush();
    });

  });

})();
