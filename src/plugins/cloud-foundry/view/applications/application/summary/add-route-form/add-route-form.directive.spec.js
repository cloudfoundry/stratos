(function() {
  'use strict';

  describe('add-route-form directive', function() {
    var $httpBackend, $scope, element, addRouteFormCtrl;

    beforeEach(module('cloud-foundry.view.applications.application.summary'));

    beforeEach(inject(function($injector) {
      var $compile = $injector.get('$compile');
      var modelManager = $injector.get('app.model.modelManager');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      $scope.onCancel = angular.noop;
      $scope.onSubmit = angular.noop;

      var markup = '<add-route-form on-cancel="onCancel()" on-submit="onSubmit()">' +
        '<add-route-form/>';
    
      element = angular.element(markup);
      $compile(element)($scope);
      
      $scope.$apply();
      
      addRouteFormCtrl = element.controller('addRouteForm');
      spyOn(addRouteFormCtrl, 'onCancel').and.callThrough();
      spyOn(addRouteFormCtrl, 'onSubmit').and.callThrough();
      spyOn(addRouteFormCtrl, 'clearForm').and.callThrough();
      spyOn(addRouteFormCtrl, 'addRouteError').and.callThrough();
    }));

    it('should be defined', function() {
      expect(element).toBeDefined();
    });

    it('should have `host`, `path` and `port`properties initially set to null', function() {
      expect(addRouteFormCtrl.host).toBe(null);
      expect(addRouteFormCtrl.path).toBe(null);
      expect(addRouteFormCtrl.port).toBe(null);
    });

    it('should have `onCancel` and `onSubmit` initially bound', function() {
      expect(addRouteFormCtrl.onCancel).toBeDefined();
      expect(addRouteFormCtrl.onSubmit).toBeDefined();
    });

    it('should have `addRouteError` initially set to false', function() {
      expect(addRouteFormCtrl.addRouteError).toBe(false);
    });

    it('should add route on addRoute()', function() {
      var mockResponse = {
        metadata: {
          guid: 'someguid'
        }
      };
      // Mock create route request
      $httpBackend.when('POST', '/pp/v1/proxy/v2/routes').respond(200, mockResponse);

      // Mock associateAppWithRoute request
      $httpBackend.when('POST', '/pp/v1/proxy/v2/routes/someguid/apps/' + app_guid).respond(200, mockResponse);

      addRouteFormCtrl.host = 'myTest';
      addRouteFormCtrl.addRoute();
      $httpBackend.flush();

      expect(addRouteFormCtrl.clearForm).toHaveBeenCalled();
      expect(addRouteFormCtrl.onSubmit).toHaveBeenCalled();
    });

    it('should not add cluster on error on addCluster()', function() {
      $httpBackend.when('POST', '/pp/v1/proxy/v2/routes').respond(500, {});

      addRouteFormCtrl.addCluster();
      $httpBackend.flush();

      expect(addRouteFormCtrl.clearForm).not.toHaveBeenCalled();
      expect(addRouteFormCtrl.onSubmit).not.toHaveBeenCalled();
      expect(addRouteFormCtrl.onAddClusterError).toHaveBeenCalled();
    });

    it('should clear form and call onCancel() on cancel()', function() {
      addRouteFormCtrl.cancel();

      expect(addRouteFormCtrl.clearForm).toHaveBeenCalled();
      expect(addRouteFormCtrl.onCancel).toHaveBeenCalled();
    });

    it('should clear form on clearForm()', function() {
      addRouteFormCtrl.clearForm();

      expect(addRouteFormCtrl.url).toBe(null);
      expect(addRouteFormCtrl.name).toBe(null);
      expect(addRouteFormCtrl.addClusterError).toBe(false);
    });

    it('should set addRouteError onAddRouteError()', function() {
      addRouteFormCtrl.onAddClusterError();
      expect(addRouteFormCtrl.addClusterError).toBe(true);
    });
  });

})();
