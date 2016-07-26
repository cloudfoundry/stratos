(function () {
  'use strict';

  describe('endpoints clusters cluster-tile directive', function () {
    var $scope, $q, $state, element, clusterTileCtrl, $compile, cfModelUsers, cfModelOrg;

    var initialService = {
      guid: "f7fbd0c7-1ce9-4e74-a891-7ffb16453af2",
      name: "lol",
      cnsi_type: "hcf",
      api_endpoint: {
        Scheme: "https",
        Opaque: "",
        User: null,
        Host: "api.hcf.helion.lol",
        Path: "",
        RawPath: "",
        RawQuery: "",
        Fragment: ""
      },
      authorization_endpoint: "https://login.hcf.helion.lol",
      token_endpoint: "https://uaa.hcf.helion.lol"
    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      $state = $injector.get('$state');
      $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();
      $scope.service = angular.fromJson(angular.toJson(initialService));
      $scope.connect = angular.noop;
      $scope.disconnect = angular.noop;
      $scope.unregister = angular.noop;

      var modelManager = $injector.get('app.model.modelManager');
      cfModelUsers = modelManager.retrieve('cloud-foundry.model.users');
      cfModelOrg = modelManager.retrieve('cloud-foundry.model.organization');

    }));

    function createCtrl() {
      var markup = '<cluster-tile service="service" connect="connect" ' +
        'disconnect="disconnect" unregister="unregister"></cluster-tile>';

      element = angular.element(markup);
      $compile(element)($scope);

      $scope.$apply();

      clusterTileCtrl = element.controller('clusterTile');
      spyOn(clusterTileCtrl, 'connect').and.callThrough();
      spyOn(clusterTileCtrl, 'disconnect').and.callThrough();
      spyOn(clusterTileCtrl, 'unregister').and.callThrough();
    }

    describe('defined + initialised', function () {
      it('should be defined', function () {
        createCtrl();

        expect(element).toBeDefined();
      });

      it('check initial state - null', function () {
        createCtrl();

        expect(clusterTileCtrl.actions).toBeDefined();
        expect(clusterTileCtrl.currentUserAccount.isAdmin()).toBeFalsy();
        expect(clusterTileCtrl.actions.length).toEqual(1);
        expect(clusterTileCtrl.actions[0].name).toEqual('Connect');

        expect(clusterTileCtrl.orgCount).toBeNull();
        expect(clusterTileCtrl.userCount).toBeNull();
        expect(clusterTileCtrl.cardData).toBeDefined();
        expect(clusterTileCtrl.cardData.title).toEqual(initialService.name);
      });

      it('check initial state - not null', function () {
        $scope.service.isConnected = true;
        spyOn(cfModelUsers, 'listAllUsers').and.returnValue($q.when([1]));
        spyOn(cfModelOrg, 'listAllOrganizations').and.returnValue($q.when([1]));
        createCtrl();

        expect(clusterTileCtrl.orgCount).toEqual(1);
        expect(clusterTileCtrl.userCount).toEqual(1);
      });
    });

    describe('setActions', function () {

      beforeEach(function () {
        createCtrl();
      });

      it('Connected', function () {
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setActions();

        expect(clusterTileCtrl.currentUserAccount.isAdmin()).toBeFalsy();
        expect(clusterTileCtrl.actions.length).toEqual(1);
        expect(clusterTileCtrl.actions[0].name).toEqual('Disconnect');
      });

      it('Not connected', function () {
        clusterTileCtrl.service.isConnected = false;
        clusterTileCtrl.setActions();

        expect(clusterTileCtrl.currentUserAccount.isAdmin()).toBeFalsy();
        expect(clusterTileCtrl.actions.length).toEqual(1);
        expect(clusterTileCtrl.actions[0].name).toEqual('Connect');
      });

      it('Is admin', function () {
        spyOn(clusterTileCtrl.currentUserAccount, 'isAdmin').and.returnValue(true);
        clusterTileCtrl.setActions();

        expect(clusterTileCtrl.currentUserAccount.isAdmin).toHaveBeenCalled();
        expect(clusterTileCtrl.actions.length).toEqual(2);
        expect(clusterTileCtrl.actions[1].name).toEqual('Unregister');
      });

      it('Is not admin', function () {
        spyOn(clusterTileCtrl.currentUserAccount, 'isAdmin').and.returnValue(true);
        clusterTileCtrl.setActions();

        expect(clusterTileCtrl.currentUserAccount.isAdmin).toHaveBeenCalled();
        expect(clusterTileCtrl.actions.length).toEqual(2);
        expect(clusterTileCtrl.actions[1].name).toEqual('Unregister');
      });

    });

    describe('setUserCount', function () {
      beforeEach(function () {
        spyOn(cfModelOrg, 'listAllOrganizations');
      });

      afterEach(function () {
        expect(cfModelOrg.listAllOrganizations).not.toHaveBeenCalled();
      });

      it('Not connected, so no call to backend', function () {
        spyOn(cfModelUsers, 'listAllUsers');
        createCtrl();

        expect(clusterTileCtrl.userCount).toBeNull();
        clusterTileCtrl.service.isConnected = false;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toBeNull();
        expect(cfModelUsers.listAllUsers).not.toHaveBeenCalled();
      });

      it('Call succeeds', function () {
        spyOn(cfModelUsers, 'listAllUsers').and.callFake(function (cnsiGuid) {
          expect(cnsiGuid).toEqual(initialService.guid);
          return $q.when(['1', '2']);
        });
        createCtrl();

        expect(clusterTileCtrl.userCount).toBeNull();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toEqual(2);
        expect(cfModelUsers.listAllUsers).toHaveBeenCalled();
      });

      it('Call succeeds - no array', function () {
        spyOn(cfModelUsers, 'listAllUsers').and.callFake(function (cnsiGuid) {
          expect(cnsiGuid).toEqual(initialService.guid);
          return $q.when();
        });
        createCtrl();

        expect(clusterTileCtrl.userCount).toBeNull();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toBeNull();
        expect(cfModelUsers.listAllUsers).toHaveBeenCalled();
      });

      it('Call fails', function () {
        spyOn(cfModelUsers, 'listAllUsers').and.callFake(function (cnsiGuid) {
          expect(cnsiGuid).toEqual(initialService.guid);
          return $q.reject();
        });
        createCtrl();

        expect(clusterTileCtrl.userCount).toBeNull();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toBeNull();
        expect(cfModelUsers.listAllUsers).toHaveBeenCalled();
      });
    });

    describe('setOrganisationCount', function () {
      beforeEach(function () {
        spyOn(cfModelUsers, 'listAllUsers');
      });

      afterEach(function () {
        expect(cfModelUsers.listAllUsers).not.toHaveBeenCalled();
      });

      it('Not connected, so no call to backend', function () {
        spyOn(cfModelOrg, 'listAllOrganizations');
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBeNull();
        clusterTileCtrl.service.isConnected = false;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toBeNull();
        expect(cfModelOrg.listAllOrganizations).not.toHaveBeenCalled();
      });

      it('Call succeeds', function () {
        spyOn(cfModelOrg, 'listAllOrganizations').and.callFake(function (cnsiGuid) {
          expect(cnsiGuid).toEqual(initialService.guid);
          return $q.when(['1', '2']);
        });
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBeNull();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toEqual(2);
        expect(cfModelOrg.listAllOrganizations).toHaveBeenCalled();
      });

      it('Call succeeds - no array', function () {
        spyOn(cfModelOrg, 'listAllOrganizations').and.callFake(function (cnsiGuid) {
          expect(cnsiGuid).toEqual(initialService.guid);
          return $q.when();
        });
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBeNull();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toBeNull();
        expect(cfModelOrg.listAllOrganizations).toHaveBeenCalled();
      });

      it('Call fails', function () {
        spyOn(cfModelOrg, 'listAllOrganizations').and.callFake(function (cnsiGuid) {
          expect(cnsiGuid).toEqual(initialService.guid);
          return $q.reject();
        });
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBeNull();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toBeNull();
        expect(cfModelOrg.listAllOrganizations).toHaveBeenCalled();
      });
    });

    describe('summary', function () {
      it('correctly executed', function () {
        createCtrl();

        spyOn($state, 'go');
        clusterTileCtrl.summary();
        expect($state.go.calls.argsFor(0)).toEqual(['endpoint.clusters.cluster.detail.organizations', {guid: initialService.guid}]);
        expect($state.go.calls.count()).toEqual(1);

      });
    });

    describe('action call plumbing', function () {
      beforeEach(function () {
        createCtrl();
      });

      it('connect', function () {
        var connect = _.find(clusterTileCtrl.actions, {name: 'Connect'});
        expect(connect).toBeDefined();
        expect(connect.execute).toBeDefined();

        connect.execute();

        expect(clusterTileCtrl.connect).toHaveBeenCalled();
        expect(clusterTileCtrl.connect.calls.count()).toEqual(1);
        expect(clusterTileCtrl.connect.calls.argsFor(0)).toEqual([initialService]);
      });

      it('disconnect', function () {
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setActions();

        var disconnect = _.find(clusterTileCtrl.actions, {name: 'Disconnect'});
        expect(disconnect).toBeDefined();
        expect(disconnect.execute).toBeDefined();

        disconnect.execute();

        expect(clusterTileCtrl.disconnect).toHaveBeenCalled();
        expect(clusterTileCtrl.disconnect.calls.count()).toEqual(1);
        expect(clusterTileCtrl.disconnect.calls.argsFor(0)).toEqual([initialService.guid]);
      });

      it('unregister', function () {
        spyOn(clusterTileCtrl.currentUserAccount, 'isAdmin').and.returnValue(true);
        clusterTileCtrl.setActions();

        var unregister = _.find(clusterTileCtrl.actions, {name: 'Unregister'});
        expect(unregister).toBeDefined();
        expect(unregister.execute).toBeDefined();

        unregister.execute();

        expect(clusterTileCtrl.unregister).toHaveBeenCalled();
        expect(clusterTileCtrl.unregister.calls.count()).toEqual(1);
        expect(clusterTileCtrl.unregister.calls.argsFor(0)).toEqual([initialService]);
      });
    });
  });

})();
