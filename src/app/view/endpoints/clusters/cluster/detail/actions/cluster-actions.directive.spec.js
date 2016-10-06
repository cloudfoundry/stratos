(function () {
  'use strict';

  describe('cluster-actions and unique-space-name directives', function () {
    var $httpBackend, element, $compile, clusterActionsCtrl;

    var userGuid = '0c97cd5a-8ef8-4f80-af46-acfa8697824e';
    var runningAuthTests = false;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module({
      'app.utils.utilsService': {
        chainStateResolve: function (state, $state, init) {
          if (runningAuthTests) {
            init();
          }
        }
      }
    }));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $compile = $injector.get('$compile');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('cluster-actions', function () {
      var initialState;

      beforeEach(inject(function ($injector) {
        var $state = $injector.get('$state');
        initialState = $state.go('endpoint.dashboard');

        // Ensure we have an initial state for the chainStateResolve to chain on to
        initialState = initialState.then(function () {
          var contextScope = $injector.get('$rootScope').$new();

          element = angular.element('<cluster-actions></cluster-actions>');
          $compile(element)(contextScope);

        });

      }));

      it('should be defined', function () {
        initialState.then(function () {
          expect(element).toBeDefined();
          expect(element.controller).toBeDefined();
        });

      });
    });

    function initAuthModel(type, $injector) {
      runningAuthTests = true;

      // Initialise auth model appropriately
      mock.cloudFoundryModel.Auth.initAuthModel(type, userGuid, $injector);

      var $scope = $injector.get('$rootScope').$new();
      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = 'guid';
      $scope.$stateParams = $stateParams;
      var markup = '<cluster-actions></cluster-actions>';
      element = angular.element(markup);
      $compile(element)($scope);
      $scope.$apply();
      clusterActionsCtrl = element.controller('clusterActions');
    }

    describe('unique-space-name', function () {

      beforeEach(inject(function ($injector) {

        var contextScope = $injector.get('$rootScope').$new();
        contextScope.model = '';

        element = angular.element('<input unique-space-name ng-model="model"></input>');
        $compile(element)(contextScope);

      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });
    });

    describe('cluster actions auth tests for admin', function () {

      beforeEach(inject(function ($injector) {
        initAuthModel('admin', $injector);
      }));

      it('should be defined', function () {
        expect(clusterActionsCtrl).toBeDefined();
      });

      it('should have create organization enabled', function () {
        expect(clusterActionsCtrl.clusterActions[0].disabled).toBe(false);
      });

      it('should have create space enabled', function () {
        expect(clusterActionsCtrl.clusterActions[1].disabled).toBe(false);
      });

      it('should have assign users enabled', function () {
        expect(clusterActionsCtrl.clusterActions[2].disabled).toBe(false);
      });
    });

    describe('cluster actions auth tests for non-admin space developer ', function () {

      beforeEach(inject(function ($injector) {
        initAuthModel('space_developer', $injector);
      }));

      it('should be defined', function () {
        expect(clusterActionsCtrl).toBeDefined();
      });

      it('should have create organization disabled', function () {
        expect(clusterActionsCtrl.clusterActions[0].disabled).toBe(true);
      });

      it('should have create space disabled', function () {
        expect(clusterActionsCtrl.clusterActions[1].disabled).toBe(true);
      });

      it('should have assign users disabled', function () {
        expect(clusterActionsCtrl.clusterActions[2].disabled).toBe(true);
      });
    });

  });

})();
