(function () {
  'use strict';

  describe('endpoint clusters', function () {
    var $q, $state, $scope, modelManager, utilsService, clusterTilesCtrl, serviceInstanceModel,
      userServiceInstanceModel, stackatoInfo, $stateParams;

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
    beforeEach(module({
      'app.utils.utilsService': {
        chainStateResolve: function (state, $state, init) {
          init();
        }
      }
    }));

    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      $state = $injector.get('$state');
      $scope = $injector.get('$rootScope').$new();
      $stateParams = $injector.get('$stateParams');

      modelManager = $injector.get('modelManager');
      utilsService = $injector.get('app.utils.utilsService');
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
      clusterTilesCtrl = new ClusterTilesCtrl($q, $state, $stateParams, modelManager, utilsService);
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
        spyOn(stackatoInfo, 'getStackatoInfo').and.returnValue($q.resolve());

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
        spyOn(stackatoInfo, 'getStackatoInfo').and.returnValue($q.reject());
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
        spyOn(clusterTilesCtrl, 'createClusterList').and.callThrough();

        expect(clusterTilesCtrl.state).toEqual('noClusters');
        clusterTilesCtrl.refreshClusterModel();
        expect(clusterTilesCtrl.state).toEqual('loading');
        $scope.$digest();
        expect(clusterTilesCtrl.state).toEqual('noClusters');
        expect(clusterTilesCtrl.createClusterList).toHaveBeenCalled();
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
