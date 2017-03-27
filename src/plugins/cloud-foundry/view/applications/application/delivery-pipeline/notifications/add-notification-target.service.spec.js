(function () {
  'use strict';

  describe('Add-notification-target', function () {
    var addNotificationTargetService, addNotificationTargetController, $httpBackend, $uibModalInstance;

    var request = {
      cnsiGuid: 'guid',
      projectId: 'id',
      data: {
        type: 'slack',
        name: 'slackNT',
        location: 'http://slack.com',
        token: 'oauth'
      }
    };

    function addTarget(fail) {

      $httpBackend.expectPOST('/pp/v1/proxy/v2/notifications/targets')
        .respond(fail ? 400 : 200, {
          type: request.data.type,
          token: request.data.token,
          name: request.data.name,
          location: request.data.location
        });

      addNotificationTargetController.userInput = {
        notificationTargetDetails: request.data,
        notificationTargetType: {
          item_value: request.data.type
        }
      };
      addNotificationTargetController.hceCnsi = {
        guid: request.guid
      };
      addNotificationTargetController.project = {
        id: request.id
      };

      addNotificationTargetController.actions.finish();
      $httpBackend.flush();
    }

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {

      var modelManager = $injector.get('modelManager');
      var apiManager = $injector.get('apiManager');
      var $q = $injector.get('$q');
      $uibModalInstance = {
        close: angular.noop,
        dismiss: angular.noop
      };
      addNotificationTargetService = $injector.get('cloud-foundry.view.applications.application.delivery-pipeline.addNotificationService');
      var $controller = $injector.get('$controller');
      addNotificationTargetController = $controller('cloud-foundry.view.applications.application.delivery-pipeline.addNotificationTargetController', {
        modelManager: modelManager,
        apiManager: apiManager,
        $q: $q,
        $uibModalInstance: $uibModalInstance
      });
      $httpBackend = $injector.get('$httpBackend');

    }));

    it('should be defined', function () {
      expect(addNotificationTargetService).toBeDefined();
      expect(addNotificationTargetController).toBeDefined();
    });

    it('should pass correct content spec to detailView', function () {
      var modalObj = addNotificationTargetService.add();
      expect(modalObj.opened).toBeDefined();
    });

    it('should invoke dismiss on stop', function () {
      spyOn($uibModalInstance, 'dismiss').and.callThrough();
      addNotificationTargetController.actions.stop();
      expect($uibModalInstance.dismiss).toHaveBeenCalled();
    });

    it('should invoke close', function () {
      spyOn($uibModalInstance, 'close').and.callThrough();
      addTarget();
      expect($uibModalInstance.close).toHaveBeenCalled();
      expect(addNotificationTargetController.indications.busy).toBe(false);
      expect(addNotificationTargetController.indications.error).toBe(false);
    });

    it('should not invoke close on failure and error indication should be true', function () {
      spyOn($uibModalInstance, 'close').and.callThrough();
      addTarget(true);
      expect($uibModalInstance.close).not.toHaveBeenCalled();
      expect(addNotificationTargetController.indications.error).toBe(true);
    });

  });

})();
