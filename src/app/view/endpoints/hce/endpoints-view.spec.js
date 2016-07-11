(function () {
  'use strict';

  describe('endpoint view tests', function () {
    var $httpBackend, $q, controller,
      modelManager, userServiceInstanceModel, serviceInstanceModel, items, apiManager;
    var detailViewCalled = false;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module('app.view.endpoints.hce'));
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
      apiManager = $injector.get('app.api.apiManager');
      var hceReg = $injector.get('app.view.hceRegistration');
      var log = $injector.get('$log');

      var EndpointsViewController = $state.get('endpoint.hce').controller;
      controller = new EndpointsViewController(modelManager, apiManager, hceReg, log, $q);

      items = [{
        guid: 1,
        name: 'c1',
        url: 'c1_url',
        api_endpoint: {
          Scheme: 'http',
          Host: 'api.foo.com'
        }
      }];

      userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      spyOn(userServiceInstanceModel, 'disconnect').and.callThrough();
      spyOn(serviceInstanceModel, 'remove').and.callThrough();

      $httpBackend.when('GET', '/pp/v1/proxy/v2/info').respond(200, {});
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

      it('should invoke disconnection', function () {

        userServiceInstanceModel.list().then(function () {
          controller.disconnect(items[0]);
          $httpBackend.flush();
          expect(userServiceInstanceModel.disconnect).toHaveBeenCalled();
        });
      });

      it('should invoke unregister', function () {

        serviceInstanceModel.list().then(function () {
          controller.unregister({model: items[0]});
          $httpBackend.flush();
          expect(userServiceInstanceModel.disconnect).toHaveBeenCalled();
        });
      });
    });
  });

})();
