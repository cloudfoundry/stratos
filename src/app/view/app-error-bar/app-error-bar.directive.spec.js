(function () {
  'use strict';

  describe('app error bar directive', function () {
    var $element, appErrorBarCtrl, $scope, eventService;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();
      var markup = '<app-error-bar displayed="test"></app-error-bar>';
      $element = angular.element(markup);
      $compile($element)($scope);
      $scope.$apply();
      eventService = $injector.get('app.event.eventService');
      appErrorBarCtrl = $element.controller('appErrorBar');
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    describe('An AppErrorBarController instance', function () {
      it('should be defined', function () {
        expect(appErrorBarCtrl).toBeDefined();
      });

      it('should have properties', function () {
        expect(appErrorBarCtrl.eventService).toBeDefined();
        expect(appErrorBarCtrl.displayed).toBeDefined();
        expect(appErrorBarCtrl.removeSetListener).toBeDefined();
        expect(appErrorBarCtrl.removeClearListener).toBeDefined();
        expect(appErrorBarCtrl.message).not.toBeDefined();
        expect(appErrorBarCtrl.displayed).toBe(false);
      });

      it('should receieve set error event', function () {
        eventService.$broadcast(eventService.events.APP_ERROR_NOTIFY, 'TEST_MSG_1');
        $scope.$apply();
        expect(appErrorBarCtrl.displayed).toBe(true);
        expect(appErrorBarCtrl.message).toBeDefined();
        expect(appErrorBarCtrl.message).toBe('TEST_MSG_1');
      });

      it('should receieve clear error event', function () {
        eventService.$broadcast(eventService.events.APP_ERROR_NOTIFY, 'TEST_MSG_2');
        $scope.$apply();
        expect(appErrorBarCtrl.displayed).toBe(true);
        eventService.$broadcast(eventService.events.APP_ERROR_CLEAR);
        $scope.$apply();
        expect(appErrorBarCtrl.displayed).toBe(false);
        expect(appErrorBarCtrl.message).not.toBeDefined();
      });

      it('should remove handlers on destroy', function () {
        expect(appErrorBarCtrl.removeSetListener).toBeDefined();
        expect(appErrorBarCtrl.removeClearListener).toBeDefined();
        $scope.$destroy();
        expect(appErrorBarCtrl.removeSetListener).not.toBeDefined();
        expect(appErrorBarCtrl.removeClearListener).not.toBeDefined();
      });
    });
  });
})();
