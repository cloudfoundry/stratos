(function () {
  'use strict';

  describe('delivery-pipeline-status directive', function () {
    var element, $httpBackend, controller, detailViewSpy;

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
      module(function ($provide) {
        detailViewSpy = jasmine.createSpy();
        $provide.constant('helion.framework.widgets.detailView', detailViewSpy);
      });

      inject(function ($injector) {
        var $compile = $injector.get('$compile');
        var contextScope = $injector.get('$rootScope').$new();
        contextScope.pipeline = {};
        contextScope.hce = {};
        $httpBackend = $injector.get('$httpBackend');

        var markup = '<delivery-pipeline-status>' +
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
      expect(detailViewSpy).toHaveBeenCalled();
    });

  });

})();
