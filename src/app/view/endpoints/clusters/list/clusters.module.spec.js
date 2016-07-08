(function () {
  'use strict';

  describe('endpoint clusters', function () {
    var $q, $state, $scope, modelManager, confirmModal, clustersCtrl, hcfRegistration, serviceInstanceModel,
      userServiceInstanceModel, $uibModal;

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

      var $httpBackend = $injector.get('$httpBackend');
      // Something other than the controller is calling these.
      $httpBackend.when('GET', '/pp/v1/cnsis').respond(500);
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(500);
    }));

    function createCluster() {
      var ClustersCtrl = $state.get('endpoints.clusters').controller;
      clustersCtrl = new ClustersCtrl(modelManager, $q, hcfRegistration, confirmModal);
    }

    describe('Init', function () {

      it('should be defined', function () {
        createCluster();

        expect(clustersCtrl).toBeDefined();
      });

      it('initial state', function () {
        spyOn(serviceInstanceModel, 'list');
        spyOn(userServiceInstanceModel, 'list');

        createCluster();

        expect(clustersCtrl.boundUnregister).toBeDefined();
        expect(clustersCtrl.boundConnect).toBeDefined();
        expect(clustersCtrl.boundDisconnect).toBeDefined();

        expect(serviceInstanceModel.list).toHaveBeenCalled();
        expect(userServiceInstanceModel.list).toHaveBeenCalled();

      });
    });

    describe('updateClusterList', function () {

      it('success - disconnected', function () {
        spyOn(serviceInstanceModel, 'list').and.callFake(function () {
          serviceInstanceModel.serviceInstances = [hceService, hcfService];
          return $q.when(serviceInstanceModel.serviceInstances);
        });
        spyOn(userServiceInstanceModel, 'list').and.callFake(function () {
          userServiceInstanceModel.serviceInstances = {};
          userServiceInstanceModel.serviceInstances[hcfUserService.guid] = hcfUserService;
          return $q.when(userServiceInstanceModel.serviceInstances);
        });

        createCluster();
        // updateClusterList should have been called as part of creation.
        expect(serviceInstanceModel.list).toHaveBeenCalled();
        expect(userServiceInstanceModel.list).toHaveBeenCalled();

        // Before promises return
        expect(clustersCtrl.serviceInstances).toBeNull();

        // Kick off promises
        $scope.$digest();

        // After promises return
        expect(clustersCtrl.serviceInstances).toBeDefined();
        expect(clustersCtrl.serviceInstances.length).toEqual(1);
        expect(clustersCtrl.serviceInstances[0]).not.toBe(hcfService);
        expect(clustersCtrl.serviceInstances[0].isConnected).toBeDefined();
        expect(clustersCtrl.serviceInstances[0].isConnected).toEqual(false);
        expect(clustersCtrl.serviceInstances[0].hasExpired).toBeDefined();
        expect(clustersCtrl.serviceInstances[0].hasExpired).toEqual(false);
      });

      it('success - connected + not expired token', function () {
        spyOn(serviceInstanceModel, 'list').and.callFake(function () {
          serviceInstanceModel.serviceInstances = [hceService, hcfService];
          return $q.when(serviceInstanceModel.serviceInstances);
        });
        spyOn(userServiceInstanceModel, 'list').and.callFake(function () {
          var cloned = angular.fromJson(angular.toJson(hcfUserService));
          cloned.valid = true;
          userServiceInstanceModel.serviceInstances = {};
          userServiceInstanceModel.serviceInstances[cloned.guid] = cloned;
          return $q.when(userServiceInstanceModel.serviceInstances);
        });

        createCluster();
        // updateClusterList should have been called as part of creation.

        // Kick off promises
        $scope.$digest();

        expect(clustersCtrl.serviceInstances).toBeDefined();
        expect(clustersCtrl.serviceInstances.length).toEqual(1);
        expect(clustersCtrl.serviceInstances[0].isConnected).toEqual(true);
        expect(clustersCtrl.serviceInstances[0].hasExpired).toEqual(false);
      });

      it('success - disconnected + expired token', function () {
        spyOn(serviceInstanceModel, 'list').and.callFake(function () {
          serviceInstanceModel.serviceInstances = [hceService, hcfService];
          return $q.when(serviceInstanceModel.serviceInstances);
        });
        spyOn(userServiceInstanceModel, 'list').and.callFake(function () {
          var cloned = angular.fromJson(angular.toJson(hcfUserService));
          cloned.token_expiry = Number.MIN_VALUE;
          userServiceInstanceModel.serviceInstances = {};
          userServiceInstanceModel.serviceInstances[cloned.guid] = cloned;
          return $q.when(userServiceInstanceModel.serviceInstances);
        });

        createCluster();
        // updateClusterList should have been called as part of creation.

        // Kick off promises
        $scope.$digest();

        expect(clustersCtrl.serviceInstances).toBeDefined();
        expect(clustersCtrl.serviceInstances.length).toEqual(1);
        expect(clustersCtrl.serviceInstances[0].isConnected).toEqual(false);
        expect(clustersCtrl.serviceInstances[0].hasExpired).toEqual(true);
      });

      it('fail', function () {
        spyOn(serviceInstanceModel, 'list').and.returnValue($q.reject());
        spyOn(userServiceInstanceModel, 'list').and.returnValue($q.reject());

        createCluster();
        // updateClusterList should have been called as part of creation.

        // Before' promises return
        expect(clustersCtrl.serviceInstances).toBeNull();

        // Kick off promises
        $scope.$digest();

        // After promises return
        expect(clustersCtrl.serviceInstances).toBeFalsy();
      });
    });

    describe('connect', function () {

      beforeEach(function () {
        createCluster();
      });

      it('on cancel', function () {
        clustersCtrl.onConnectCancel();
        expect(clustersCtrl.credentialsFormCNSI).toBeFalsy();
      });

      it('on success', function () {
        spyOn(clustersCtrl, 'updateClusterList');
        clustersCtrl.onConnectSuccess();
        expect(clustersCtrl.credentialsFormCNSI).toBeFalsy();
        expect(clustersCtrl.updateClusterList).toHaveBeenCalled();
      });

      it('correct param', function () {
        clustersCtrl.connect(hcfService.guid);
        expect(clustersCtrl.credentialsFormCNSI).toEqual(hcfService.guid);
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
        spyOn(clustersCtrl, 'updateClusterList');
        clustersCtrl.disconnect(hcfUserService.guid);
        $scope.$digest();
        expect(userServiceInstanceModel.disconnect).toHaveBeenCalled();
        expect(clustersCtrl.updateClusterList).toHaveBeenCalled();
      });

      it('failure', function () {
        spyOn(userServiceInstanceModel, 'disconnect').and.callFake(function (guid) {
          expect(guid).toEqual(hcfUserService.guid);
          return $q.reject();
        });
        spyOn(clustersCtrl, 'updateClusterList');
        clustersCtrl.disconnect(hcfUserService.guid);
        $scope.$digest();
        expect(userServiceInstanceModel.disconnect).toHaveBeenCalled();
        expect(clustersCtrl.updateClusterList).not.toHaveBeenCalled();
      });
    });

    describe('register', function () {
      beforeEach(function () {
        createCluster();
      });

      it('success', function () {
        spyOn(hcfRegistration, 'add').and.returnValue($q.when());
        spyOn(clustersCtrl, 'updateClusterList');
        clustersCtrl.register();
        $scope.$digest();
        expect(hcfRegistration.add).toHaveBeenCalled();
        expect(clustersCtrl.updateClusterList).toHaveBeenCalled();
      });

      it('failure', function () {
        spyOn(hcfRegistration, 'add').and.returnValue($q.reject());
        spyOn(clustersCtrl, 'updateClusterList');
        clustersCtrl.register();
        $scope.$digest();
        expect(hcfRegistration.add).toHaveBeenCalled();
        expect(clustersCtrl.updateClusterList).not.toHaveBeenCalled();
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
        spyOn(clustersCtrl, 'updateClusterList');

        clustersCtrl.unregister(hcfService);
        $scope.$digest();

        expect(serviceInstanceModel.remove).toHaveBeenCalled();
        expect(clustersCtrl.updateClusterList).toHaveBeenCalled();
      });

      it('failure', function () {
        spyOn($uibModal, 'open').and.returnValue({
          result: $q.reject()
        });
        spyOn(serviceInstanceModel, 'remove').and.callFake(function (serviceInstance) {
          expect(serviceInstance).toBe(hcfService);
          return $q.when();
        });
        spyOn(clustersCtrl, 'updateClusterList');

        clustersCtrl.unregister(hcfService);
        $scope.$digest();

        expect(serviceInstanceModel.remove).not.toHaveBeenCalled();
        expect(clustersCtrl.updateClusterList).not.toHaveBeenCalled();
      });
    });
  });

})();
