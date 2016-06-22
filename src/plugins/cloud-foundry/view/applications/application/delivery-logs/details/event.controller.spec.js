(function () {
  'use strict';

  describe('Delivery logs - event detail view controller', function () {

    var controller, $httpBackend, $timeout;

    beforeEach(module('green-box-console'));
    beforeEach(module('cloud-foundry.view.applications.application.delivery-logs'));
    beforeEach(module('app.model'));

    var artifactId = 123;
    var guid = 321;

    beforeEach(inject(function ($injector, $controller, _$timeout_) {
      $httpBackend = $injector.get('$httpBackend');

      $timeout = _$timeout_;

      controller = $controller('eventDetailViewController', {
        $timeout: _$timeout_,
        $log: $injector.get('$log'),
        context: {
          event: {
            artifact_id: artifactId,
            duration: 1000
          }
        },
        content: {
          guid: guid
        },
        moment: $injector.get('moment'),
        modelManager: $injector.get('app.model.modelManager')
      });
      expect(controller).toBeDefined();
      expect(controller.log).toBeNull();
      expect(controller.duration).toBe('a few seconds');

    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('Fetch fails', function() {
      $httpBackend.expectGET('/pp/v1/proxy/v2/artifacts/' + artifactId + '/download').respond(500);
      $timeout.flush();
      $httpBackend.flush();

      expect(controller.log).toBe(false);
    });

    it('Fetch succeeds but no log', function() {
      $httpBackend.expectGET('/pp/v1/proxy/v2/artifacts/' + artifactId + '/download').respond();
      $timeout.flush();
      $httpBackend.flush();

      expect(controller.log).toBe(false);
    });

    it('Fetch succeeds', function() {
      var log = 'this is a log';
      $httpBackend.expectGET('/pp/v1/proxy/v2/artifacts/' + artifactId + '/download').respond(log);
      $timeout.flush();
      $httpBackend.flush();

      expect(controller.log).toEqual(log);
    });

  });

})();
