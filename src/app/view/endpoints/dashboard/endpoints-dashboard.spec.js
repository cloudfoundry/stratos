(function () {
  'use strict';

  describe('endpoint dashboard tests', function () {
    var $httpBackend, $q, controller, modelManager;
    var detailViewCalled = false;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module('app.view.endpoints.dashboard'));
    beforeEach(module(function ($provide) {
      var mock = function () {
        detailViewCalled = true;
        return {result: $q.reject()};
      };
      $provide.value('helion.framework.widgets.detailView', mock);
    }));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $state = $injector.get('$state');

      modelManager = $injector.get('app.model.modelManager');
      var hceReg = $injector.get('app.view.hceRegistration');
      var hcfReg = $injector.get('app.view.hcfRegistration');

      var EndpointsDashboardController = $state.get('endpoints.dashboard').controller;
      controller = new EndpointsDashboardController(modelManager, $state, hceReg, hcfReg, $q);

      var items = [{
        id: 1,
        name: 'c1',
        url: 'c1_url',
        api_endpoint: {
          Scheme: 'http',
          Host: 'api.foo.com'
        }
      }];

      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, items);
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, items);
    }));

    describe('controller tests', function () {

      it('should have `serviceInstances` property initially be {}', function () {
        expect(controller.serviceInstances).toEqual({});
      });

      it('should show cluster registration detail view when showClusterAddForm is invoked', function () {
        controller.showClusterAddForm();
        expect(detailViewCalled).toBe(true);
      });
    });
  });

})();
