(function () {
  'use strict';

  describe('endpoint clusters', function () {
    var $q, $state, $scope, modelManager, confirmModal, clusterTilesCtrl, hcfRegistration, serviceInstanceModel,
      userServiceInstanceModel, $uibModal, stackatoInfo;

    var hceService = {
      guid: '817ef115-7ae6-4591-a883-8f1c3447e012',
      name: 'HCE service',
      cnsi_type: 'hce',
      api_endpoint: {
        Scheme: 'http',
        Opaque: '',
        User: null,
        Host: '16.25.175.36:4000',
        Path: '',
        RawPath: '',
        RawQuery: '',
        Fragment: ''
      },
      authorization_endpoint: '',
      token_endpoint: ''
    };
    var hcfService = {
      guid: 'f7fbd0c7-1ce9-4e74-a891-7ffb16453af2',
      name: 'lol',
      cnsi_type: 'hcf',
      api_endpoint: {
        Scheme: 'https',
        Opaque: '',
        User: null,
        Host: 'api.hcf.helion.lol',
        Path: '',
        RawPath: '',
        awQuery: '',
        Fragment: ''
      },
      authorization_endpoint: 'https://login.hcf.helion.lol',
      token_endpoint: 'https://uaa.hcf.helion.lol'
    };
    var hcfUserService = {
      guid: 'f7fbd0c7-1ce9-4e74-a891-7ffb16453af2',
      name: 'lol',
      api_endpoint: {
        Scheme: 'https',
        Opaque: '',
        User: null,
        Host: 'api.hcf.helion.lol',
        Path: '',
        RawPath: '',
        RawQuery: '',
        Fragment: ''
      },
      account: '88bceaa5-bdce-47b8-82f3-4afc14f266f9',
      token_expiry: Number.MAX_VALUE
    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      $state = $injector.get('$state');
      $scope = $injector.get('$rootScope').$new();

      modelManager = $injector.get('app.model.modelManager');
      hcfRegistration = $injector.get('app.view.hcfRegistration');
      confirmModal = $injector.get('helion.framework.widgets.dialog.confirm');
      $uibModal = $injector.get('$uibModal');

      serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

      var $httpBackend = $injector.get('$httpBackend');
      // Something other than the controller is calling these.
      $httpBackend.when('GET', '/pp/v1/cnsis').respond(500);
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(500);
    }));

    function createCluster() {
      var ClusterTilesCtrl = $state.get('endpoint.clusters.tiles').controller;
      clusterTilesCtrl = new ClusterTilesCtrl(modelManager, $q, hcfRegistration, confirmModal);
    }

    describe('Init', function () {

      it('should be defined', function () {
        createCluster();

        expect(clusterTilesCtrl).toBeDefined();
      });

      it('initial state', function () {
        spyOn(serviceInstanceModel, 'list');
        spyOn(userServiceInstanceModel, 'list');

        createCluster();

        expect(clusterTilesCtrl.boundUnregister).toBeDefined();
        expect(clusterTilesCtrl.boundConnect).toBeDefined();
        expect(clusterTilesCtrl.boundDisconnect).toBeDefined();

        expect(serviceInstanceModel.list).toHaveBeenCalled();
        expect(userServiceInstanceModel.list).toHaveBeenCalled();

      });
    });

    describe('createClusterList', function () {

      beforeEach(function () {
        spyOn(serviceInstanceModel, 'list').and.callFake(function () {
          serviceInstanceModel.serviceInstances = [];
          return $q.when(serviceInstanceModel.serviceInstances);
        });
        spyOn(userServiceInstanceModel, 'list').and.callFake(function () {
          userServiceInstanceModel.serviceInstances = {};
          return $q.when(userServiceInstanceModel.serviceInstances);
        });

        createCluster();
        // updateClusterList should have been called as part of creation.
        expect(serviceInstanceModel.list).toHaveBeenCalled();
        expect(userServiceInstanceModel.list).toHaveBeenCalled();

        // Before promises return
        expect(clusterTilesCtrl.serviceInstances).toEqual({});

        // Kick off promises
        $scope.$digest();

        // After promises return, still empty
        expect(clusterTilesCtrl.serviceInstances).toEqual({});
      });

      it('cluster - disconnected', function () {
        serviceInstanceModel.serviceInstances = [hceService, hcfService];
        userServiceInstanceModel.serviceInstances = {};
        userServiceInstanceModel.serviceInstances[hcfUserService.guid] = hcfUserService;

        clusterTilesCtrl.createClusterList();

        expect(clusterTilesCtrl.serviceInstances).toBeDefined();
        expect(_.keys(clusterTilesCtrl.serviceInstances).length).toEqual(1);
        expect(clusterTilesCtrl.serviceInstances[hcfService.guid]).not.toBe(hcfService);
        expect(clusterTilesCtrl.serviceInstances[hcfService.guid].isConnected).toBeDefined();
        expect(clusterTilesCtrl.serviceInstances[hcfService.guid].isConnected).toEqual(false);
        expect(clusterTilesCtrl.serviceInstances[hcfService.guid].hasExpired).toBeDefined();
        expect(clusterTilesCtrl.serviceInstances[hcfService.guid].hasExpired).toEqual(false);
        expect(clusterTilesCtrl.state).toEqual('');
      });

      it('cluster - connected + not expired token', function () {
        serviceInstanceModel.serviceInstances = [hceService, hcfService];
        var cloned = angular.fromJson(angular.toJson(hcfUserService));
        cloned.valid = true;
        userServiceInstanceModel.serviceInstances = {};
        userServiceInstanceModel.serviceInstances[cloned.guid] = cloned;

        clusterTilesCtrl.createClusterList();

        expect(clusterTilesCtrl.serviceInstances).toBeDefined();
        expect(_.keys(clusterTilesCtrl.serviceInstances).length).toEqual(1);
        expect(clusterTilesCtrl.serviceInstances[hcfService.guid].isConnected).toEqual(true);
        expect(clusterTilesCtrl.serviceInstances[hcfService.guid].hasExpired).toEqual(false);
        expect(clusterTilesCtrl.state).toEqual('');
      });

      it('clusters - disconnected + expired token', function () {
        serviceInstanceModel.serviceInstances = [hceService, hcfService];
        var cloned = angular.fromJson(angular.toJson(hcfUserService));
        cloned.token_expiry = Number.MIN_VALUE;
        userServiceInstanceModel.serviceInstances = {};
        userServiceInstanceModel.serviceInstances[cloned.guid] = cloned;

        clusterTilesCtrl.createClusterList();

        expect(clusterTilesCtrl.serviceInstances).toBeDefined();
        expect(_.keys(clusterTilesCtrl.serviceInstances).length).toEqual(1);
        expect(clusterTilesCtrl.serviceInstances[hcfService.guid].isConnected).toEqual(false);
        expect(clusterTilesCtrl.serviceInstances[hcfService.guid].hasExpired).toEqual(true);
        expect(clusterTilesCtrl.state).toEqual('');
      });

      it('no clusters', function () {
        serviceInstanceModel.serviceInstances = [];
        userServiceInstanceModel.serviceInstances = {};

        clusterTilesCtrl.createClusterList();

        expect(clusterTilesCtrl.serviceInstances).toBeDefined();
        expect(_.keys(clusterTilesCtrl.serviceInstances).length).toEqual(0);
        expect(clusterTilesCtrl.state).toEqual('noClusters');
      });
    });

    describe('refreshClusterModel', function () {

      it('Calls fail', function () {
        spyOn(serviceInstanceModel, 'list').and.returnValue($q.reject());
        spyOn(userServiceInstanceModel, 'list').and.returnValue($q.reject());
        createCluster();
        $scope.$digest();

        spyOn(clusterTilesCtrl, 'refreshClusterModel').and.callThrough();
        spyOn(clusterTilesCtrl, 'createClusterList');

        expect(clusterTilesCtrl.state).toEqual('loadError');
        clusterTilesCtrl.refreshClusterModel();
        expect(clusterTilesCtrl.state).toEqual('loading');
        $scope.$digest();
        expect(clusterTilesCtrl.state).toEqual('loadError');
        expect(clusterTilesCtrl.createClusterList).not.toHaveBeenCalled();
      });

      it('Call succeeds', function () {
        spyOn(serviceInstanceModel, 'list').and.returnValue($q.when([]));
        spyOn(userServiceInstanceModel, 'list').and.returnValue($q.when([]));
        spyOn(stackatoInfo, 'getStackatoInfo').and.returnValue($q.when({}));

        createCluster();
        $scope.$digest();

        spyOn(clusterTilesCtrl, 'refreshClusterModel').and.callThrough();
        spyOn(clusterTilesCtrl, 'createClusterList');

        expect(clusterTilesCtrl.state).toEqual('noClusters');
        clusterTilesCtrl.refreshClusterModel();
        expect(clusterTilesCtrl.state).toEqual('loading');
        $scope.$digest();
        expect(clusterTilesCtrl.state).toEqual('noClusters');
        expect(clusterTilesCtrl.createClusterList).toHaveBeenCalled();
      });
    });

    describe('connect', function () {

      beforeEach(function () {
        createCluster();
      });

      it('on cancel', function () {
        clusterTilesCtrl.onConnectCancel();
        expect(clusterTilesCtrl.credentialsFormCNSI).toBeFalsy();
      });

      it('on success', function () {
        spyOn(clusterTilesCtrl, 'refreshClusterModel');
        clusterTilesCtrl.onConnectSuccess();
        expect(clusterTilesCtrl.credentialsFormCNSI).toBeFalsy();
        expect(clusterTilesCtrl.refreshClusterModel).toHaveBeenCalled();
      });

      it('correct param', function () {
        clusterTilesCtrl.connect(hcfService.guid);
        expect(clusterTilesCtrl.credentialsFormCNSI).toEqual(hcfService.guid);
      });
    });

    describe('disconnect', function () {
      beforeEach(function () {
        createCluster();
      });

      it('success', function () {
        spyOn(userServiceInstanceModel, 'disconnect').and.callFake(function (guid) {
          expect(guid).toEqual(hcfUserService.guid);
          return $q.when();
        });
        spyOn(clusterTilesCtrl, 'refreshClusterModel');
        clusterTilesCtrl.disconnect(hcfUserService.guid);
        $scope.$digest();
        expect(userServiceInstanceModel.disconnect).toHaveBeenCalled();
        expect(clusterTilesCtrl.refreshClusterModel).toHaveBeenCalled();
      });

      it('failure', function () {
        spyOn(userServiceInstanceModel, 'disconnect').and.callFake(function (guid) {
          expect(guid).toEqual(hcfUserService.guid);
          return $q.reject();
        });
        spyOn(clusterTilesCtrl, 'refreshClusterModel');
        clusterTilesCtrl.disconnect(hcfUserService.guid);
        $scope.$digest();
        expect(userServiceInstanceModel.disconnect).toHaveBeenCalled();
        expect(clusterTilesCtrl.refreshClusterModel).not.toHaveBeenCalled();
      });
    });

    describe('register', function () {
      beforeEach(function () {
        createCluster();
      });

      it('success', function () {
        spyOn(hcfRegistration, 'add').and.returnValue($q.when());
        spyOn(clusterTilesCtrl, 'refreshClusterModel');
        clusterTilesCtrl.register();
        $scope.$digest();
        expect(hcfRegistration.add).toHaveBeenCalled();
        expect(clusterTilesCtrl.refreshClusterModel).toHaveBeenCalled();
      });

      it('failure', function () {
        spyOn(hcfRegistration, 'add').and.returnValue($q.reject());
        spyOn(clusterTilesCtrl, 'refreshClusterModel');
        clusterTilesCtrl.register();
        $scope.$digest();
        expect(hcfRegistration.add).toHaveBeenCalled();
        expect(clusterTilesCtrl.refreshClusterModel).not.toHaveBeenCalled();
      });
    });

    describe('unregister', function () {
      beforeEach(function () {
        createCluster();
      });

      it('success', function () {
        spyOn($uibModal, 'open').and.returnValue({
          result: $q.when()
        });
        spyOn(serviceInstanceModel, 'remove').and.callFake(function (serviceInstance) {
          expect(serviceInstance).toBe(hcfService);
          return $q.when();
        });
        spyOn(clusterTilesCtrl, 'refreshClusterModel');

        clusterTilesCtrl.unregister(hcfService);
        $scope.$digest();

        expect(serviceInstanceModel.remove).toHaveBeenCalled();
        expect(clusterTilesCtrl.refreshClusterModel).toHaveBeenCalled();
      });

      it('failure', function () {
        spyOn($uibModal, 'open').and.returnValue({
          result: $q.reject()
        });
        spyOn(serviceInstanceModel, 'remove').and.callFake(function (serviceInstance) {
          expect(serviceInstance).toBe(hcfService);
          return $q.when();
        });
        spyOn(clusterTilesCtrl, 'refreshClusterModel');

        clusterTilesCtrl.unregister(hcfService);
        $scope.$digest();

        expect(serviceInstanceModel.remove).not.toHaveBeenCalled();
        expect(clusterTilesCtrl.refreshClusterModel).not.toHaveBeenCalled();
      });
    });

    describe('state', function () {

      beforeEach(function () {
        createCluster();
      });

      it('has clusters, always show them', function () {
        clusterTilesCtrl.serviceInstances = {};
        clusterTilesCtrl.serviceInstances[hcfService.guid] = hcfService;
        clusterTilesCtrl.updateState(true, false);
        expect(clusterTilesCtrl.state).toEqual('');
      });

      it('no clusters, loading', function () {
        clusterTilesCtrl.serviceInstances = {};
        clusterTilesCtrl.updateState(true, false);
        expect(clusterTilesCtrl.state).toEqual('loading');
      });

      it('no clusters, load error', function () {
        clusterTilesCtrl.serviceInstances = {};
        clusterTilesCtrl.updateState(false, true);
        expect(clusterTilesCtrl.state).toEqual('loadError');
      });

      it('no clusters, loaded', function () {
        clusterTilesCtrl.serviceInstances = {};
        clusterTilesCtrl.updateState(false, false);
        expect(clusterTilesCtrl.state).toEqual('noClusters');
      });

      it('handles null clusters', function () {
        clusterTilesCtrl.serviceInstances = null;
        clusterTilesCtrl.loading = true;
        clusterTilesCtrl.updateState(true, false);
        expect(clusterTilesCtrl.state).toEqual('loading');
      });

    });
  });

})();
