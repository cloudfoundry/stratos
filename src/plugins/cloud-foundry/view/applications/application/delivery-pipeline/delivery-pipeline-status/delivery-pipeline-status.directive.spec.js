(function () {
  'use strict';

  describe('delivery-pipeline-status directive', function () {
    var element, $httpBackend, controller, eventEmitted;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module({
      'app.event.eventService': {
        $emit: function (event) {

          if (event === 'cf.events.START_ADD_PIPELINE_WORKFLOW') {
            eventEmitted = true;
          }
        },
        $on: angular.noop,
        events: {
          LOGIN: 'login'
        }
      }
    }));
    beforeEach(inject(function ($injector) {
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
    }));

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
      expect(eventEmitted).toBe(true);
    });

  });

})();
