(function () {
  'use strict';

  describe('variables manager service', function () {
    var $controller, modelManager, dialogContext, promise, $httpBackend, $timeout, $log, moment, $q;

    var artifactId = 123;
    var guid = 321;
    var event = {
      artifact_id: artifactId,
      duration: 1000
    };

    beforeEach(module('green-box-console'));
    beforeEach(module('cloud-foundry.view.applications.application.delivery-logs'));
    beforeEach(module(function ($provide) {
      var mock = function(config, context) {
        dialogContext = context;
        $controller = config.controller;
        return $q.reject();
      };
      $provide.value('helion.framework.widgets.detailView', mock);
    }));

    beforeEach(inject(function ($injector, _$timeout_, _$log_, _$q_) {
      $httpBackend = $injector.get('$httpBackend');
      $q = _$q_;

      $timeout = _$timeout_;
      $log = _$log_;
      moment = $injector.get('moment');
      modelManager = $injector.get('app.model.modelManager');

      var viewEvent = $injector.get('viewEventDetailView');
      promise = viewEvent.open(event, guid);
      expect(promise).not.toBe(null);
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Factory', function() {

      describe("open", function() {
        it("Plumbing", function() {
          /* eslint-disable */
          new $controller($timeout, $log, dialogContext, undefined, moment, modelManager);
          /* eslint-enable */
          expect(dialogContext.guid).toEqual(guid);
          expect(dialogContext.event).toEqual(event);
        });
      });
    });

    describe('Controller', function() {
      var controller;

      beforeEach(function() {
        controller = new $controller($timeout, $log, dialogContext, undefined, moment, modelManager);
        expect(controller).toBeDefined();
        expect(controller.log).toBeNull();
        expect(controller.duration).toBe('a few seconds');
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
  });
})();
