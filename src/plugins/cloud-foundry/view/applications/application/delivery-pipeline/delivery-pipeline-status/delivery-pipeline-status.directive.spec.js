(function () {
  'use strict';

  describe('delivery-pipeline-status directive', function () {
    var element, $httpBackend, controller, setupPipelineSpy;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module({
      'app.event.eventService': {
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

        var markup = '<delivery-pipeline-status hce="hce" pipeline="pipeline" setup="setup">' +
          '</delivery-pipeline-status>';

        element = angular.element(markup);
        $compile(element)(contextScope);

        contextScope.$apply();
        controller = element.controller('deliveryPipelineStatus');
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
