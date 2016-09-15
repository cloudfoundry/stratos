(function () {
  'use strict';

  describe('notification-target', function () {
    var $scope, $controller, $httpBackend;

    var request = {
      cnsiGuid: 'guid',
      projectId: 1,
      data: {
        type: 'slack',
        name: 'slackNT',
        location: 'http://slack.com',
        token: 'oauth'
      }
    };

    var targetType = {
      title: 'slack',
      item_value: 'slack'
    };

    var userInput = {
      hceCnsi: {
        guid: 'guid'
      },
      projectId: 'id',
      notificationTargets: []

    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module({
      'helion.framework.widgets.asyncTaskDialog': function (content, context, actionTask) {
        return {
          content: content,
          context: context,
          actionTask: actionTask
        };
      }
    }));

    beforeEach(inject(function ($injector) {
      $scope = $injector.get('$rootScope').$new();
      $httpBackend = $injector.get('$httpBackend');
      var $compile = $injector.get('$compile');

      var markup = '<notification-target  target-type="targetType"  user-input="userInput" add-app-mode=""></notification-target>';

      $scope.targetType = targetType;
      $scope.userInput = userInput;
      $scope.addAppMode = true;
      var element = angular.element(markup);
      $compile(element)($scope);
      $scope.$apply();
      $controller = element.controller('notificationTarget');

      expect($controller).toBeDefined();
      expect($controller).not.toBe(null);

    }));

    it('should succeed adding a target', function () {

      var response = [{
        createdDate: null,
        id: 10,
        location: request.data.location,
        name: request.data.name,
        token: request.data.token,
        type: request.data.type
      }];
      $httpBackend.expectPOST('/pp/v1/proxy/v2/notifications/targets?project_id=id')
        .respond(200, {
          type: request.data.type,
          token: request.data.token,
          name: request.data.name,
          location: request.data.location
        });

      $httpBackend.expectGET('/pp/v1/proxy/v2/notifications/targets?project_id=id')
        .respond(200, response);

      var modalDialog = $controller.addTarget();

      expect(modalDialog.actionTask).toBeDefined();
      modalDialog.actionTask({
        type: request.data.type,
        token: request.data.token,
        name: request.data.name,
        location: request.data.location
      });
      $httpBackend.flush();
      expect(angular.toJson($controller.userInput.notificationTargets)).toEqual(angular.toJson(response));
    });

    it('should show correct count for type', function () {

      function getNotificationTarget(type) {
        return {
          createdDate: null,
          id: 10,
          location: request.data.location,
          name: request.data.name,
          token: request.data.token,
          type: type
        };
      }

      userInput.notificationTargets = [];
      for (var i = 0; i < 5; i++) {
        userInput.notificationTargets.push(getNotificationTarget('slack'));
        userInput.notificationTargets.push(getNotificationTarget('flowdock'));
        userInput.notificationTargets.push(getNotificationTarget('bitbucket'));
        userInput.notificationTargets.push(getNotificationTarget('http'));
      }

      expect($controller.getCountForType()).toEqual(5);
    });

  });

})();
