(function () {
  'use strict';

  describe('application gallery card', function () {
    var $scope, $controller, $httpBackend, $state, modelManager;

    var app = {
      metadata: {
        guid: 'appGuid'
      },
      entity: {
        name: 'appName',
        state: 'STARTED'
      }
    };
    var cnsiGuid = 'cnsiGuid';

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $scope = $injector.get('$rootScope').$new();
      $httpBackend = $injector.get('$httpBackend');
      $state = $injector.get('$state');
      modelManager = $injector.get('modelManager');

      var $compile = $injector.get('$compile');

      var markup = '<application-gallery-card app="app" cnsi-guid="cnsiGuid"></application-gallery-card>';

      $scope.app = app;
      $scope.cnsiGuid = cnsiGuid;

      var element = angular.element(markup);
      $compile(element)($scope);
      $scope.$apply();
      $controller = element.controller('applicationGalleryCard');

      expect($controller).toBeDefined();
      expect($controller).not.toBe(null);

    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('initialized', function () {
      expect($controller.canShowStats).toBeTruthy();
    });

    it('goToApp', function () {
      spyOn($state, 'go').and.callFake(function (state, guids) {
        expect(state).toEqual('cf.applications.application.summary');
        expect(guids).toEqual({
          cnsiGuid: cnsiGuid,
          guid: app.metadata.guid
        });
      });

      var appModel = modelManager.retrieve('cloud-foundry.model.application');
      spyOn(appModel, 'initApplicationFromSummary').and.callFake(function (inApp) {
        expect(inApp).toEqual(app);
      });

      $controller.goToApp();

      expect($state.go).toHaveBeenCalled();
      expect(appModel.initApplicationFromSummary).toHaveBeenCalled();
    });

  });

})();
