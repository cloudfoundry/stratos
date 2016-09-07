(function () {
  'use strict';

  describe('endpoints clusters cluster-tile directive', function () {
    var $scope, $q, $state, element, clusterTileCtrl, $compile, cfAPIUsers, cfAPIOrg;

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

      var apiManager = $injector.get('app.api.apiManager');
      cfAPIUsers = apiManager.retrieve('cloud-foundry.api.Users');
      cfAPIOrg = apiManager.retrieve('cloud-foundry.api.Organizations');

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

        expect(clusterTileCtrl.orgCount).toBe(0);
        expect(clusterTileCtrl.userCount).toBe(0);
        expect(clusterTileCtrl.getCardData()).toBeDefined();
        expect(clusterTileCtrl.getCardData().title).toEqual(initialService.name);
      });

      it('check initial state - not null', function () {
        $scope.service.isConnected = true;
        spyOn(cfAPIUsers, 'ListAllUsers').and.returnValue($q.when({ data: { total_results: 1 }}));
        spyOn(cfAPIOrg, 'ListAllOrganizations').and.returnValue($q.when({ data: { total_results: 1 }}));
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
        spyOn(cfAPIOrg, 'ListAllOrganizations');
      });

      afterEach(function () {
        expect(cfAPIOrg.ListAllOrganizations).not.toHaveBeenCalled();
      });

      it('Not connected, so no call to backend', function () {
        spyOn(cfAPIUsers, 'ListAllUsers');
        createCtrl();

        expect(clusterTileCtrl.userCount).toBe(0);
        clusterTileCtrl.service.isConnected = false;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toBe(0);
        expect(cfAPIUsers.ListAllUsers).not.toHaveBeenCalled();
      });

      it('Call succeeds', function () {
        spyOn(cfAPIUsers, 'ListAllUsers').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cnap-cnsi-list']).toEqual(initialService.guid);
          return $q.when({ data: { total_results: 2 }});
        });
        createCtrl();

        expect(clusterTileCtrl.userCount).toBe(0);
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toEqual(2);
        expect(cfAPIUsers.ListAllUsers).toHaveBeenCalled();
      });

      it('Call succeeds - empty list', function () {
        spyOn(cfAPIUsers, 'ListAllUsers').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cnap-cnsi-list']).toEqual(initialService.guid);
          return $q.when({ data: { total_results: 0 }});
        });
        createCtrl();

        expect(clusterTileCtrl.userCount).toBe(0);
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toBe(0);
        expect(cfAPIUsers.ListAllUsers).toHaveBeenCalled();
      });

      it('Call fails', function () {
        spyOn(cfAPIUsers, 'ListAllUsers').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cnap-cnsi-list']).toEqual(initialService.guid);
          return $q.reject();
        });
        createCtrl();

        expect(clusterTileCtrl.userCount).toBe(0);
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toBeUndefined();
        expect(cfAPIUsers.ListAllUsers).toHaveBeenCalled();
      });
    });

    describe('setOrganisationCount', function () {
      beforeEach(function () {
        spyOn(cfAPIUsers, 'ListAllUsers');
      });

      afterEach(function () {
        expect(cfAPIUsers.ListAllUsers).not.toHaveBeenCalled();
      });

      it('Not connected, so no call to backend', function () {
        spyOn(cfAPIOrg, 'ListAllOrganizations');
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBe(0);
        clusterTileCtrl.service.isConnected = false;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toBe(0);
        expect(cfAPIOrg.ListAllOrganizations).not.toHaveBeenCalled();
      });

      it('Call succeeds', function () {
        spyOn(cfAPIOrg, 'ListAllOrganizations').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cnap-cnsi-list']).toEqual(initialService.guid);
          return $q.when({ data: { total_results: 2 }});
        });
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBe(0);
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toEqual(2);
        expect(cfAPIOrg.ListAllOrganizations).toHaveBeenCalled();
      });

      it('Call succeeds - empty list', function () {
        spyOn(cfAPIOrg, 'ListAllOrganizations').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cnap-cnsi-list']).toEqual(initialService.guid);
          return $q.when({ data: { total_results: 0 }});
        });
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBe(0);
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toBe(0);
        expect(cfAPIOrg.ListAllOrganizations).toHaveBeenCalled();
      });

      it('Call fails', function () {
        spyOn(cfAPIOrg, 'ListAllOrganizations').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cnap-cnsi-list']).toEqual(initialService.guid);
          return $q.reject();
        });
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBe(0);
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toBeUndefined();
        expect(cfAPIOrg.ListAllOrganizations).toHaveBeenCalled();
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
