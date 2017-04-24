(function () {
  'use strict';

  describe('ce-delivery-Pipeline-Status directive', function () {
    var element, $httpBackend, controller, setupPipelineSpy;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
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

        var markup = '<ce-delivery-Pipeline-Status hce="hce" pipeline="pipeline" setup="setup">' +
          '</ce-delivery-Pipeline-Status>';

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
