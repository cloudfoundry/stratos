(function () {
  'use strict';

  describe('ce-delivery-pipeline-status directive', function () {
    var element, $httpBackend, controller, setupPipelineSpy;

    beforeEach(module('templates'));
    beforeEach(module('console-app'));
    beforeEach(module({
      appEventService: {
        $emit: function () {
        },
        $on: angular.noop,
        events: {
          LOGIN: 'login'
        }
      }
    }));

    beforeEach(function () {
      inject(function ($injector) {
        var $compile = $injector.get('$compile');
        var contextScope = $injector.get('$rootScope').$new();
        setupPipelineSpy = jasmine.createSpy();

        contextScope.pipeline = {};
        contextScope.hce = {};
        contextScope.setup = setupPipelineSpy;

        $httpBackend = $injector.get('$httpBackend');

        var markup = '<ce-delivery-pipeline-status hce="hce" pipeline="pipeline" setup="setup">' +
          '</ce-delivery-pipeline-status>';

        element = angular.element(markup);
        $compile(element)(contextScope);

        contextScope.$apply();
        controller = element.controller('ceDeliveryPipelineStatus');
      });
    });

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(element).toBeDefined();
      expect(controller).toBeDefined();
    });

    it('should emit event when setting up pipeline', function () {
      controller.setupPipeline();
      expect(setupPipelineSpy).toHaveBeenCalled();
    });

  });

})();
