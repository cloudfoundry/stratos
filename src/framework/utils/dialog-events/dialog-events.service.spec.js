(function () {
  'use strict';

  describe('dialogEvents servuice', function () {

    var dialogEvents, $scope;

    beforeEach(module('helion.framework.utils'));
    beforeEach(inject(function ($injector) {
      $scope = $injector.get('$rootScope').$new();
      dialogEvents = $injector.get('helion.framework.utils.dialogEvents');
    }));

    it('shoule be available', function () {
      expect(dialogEvents).toBeDefined();
      expect(dialogEvents.configure).toBeDefined();
      expect(dialogEvents.notifyOpened).toBeDefined();
      expect(dialogEvents.notifyClosed).toBeDefined();
    });

    it('should do nothing when not configured with a scope', function () {
      dialogEvents.notifyOpened();
      dialogEvents.notifyClosed();
    });

    describe('it should send events', function () {

      var startCount, endCount;

      beforeEach(function () {
        startCount = 0;
        endCount = 0;
        dialogEvents.configure({ scope: $scope });
        $scope.$on('MODAL_INTERACTION_START', function () {
          startCount++;
        });
        $scope.$on('MODAL_INTERACTION_END', function () {
          endCount++;
        });

      });

      it('should send open event', function () {
        expect(startCount).toBe(0);
        dialogEvents.notifyOpened();
        $scope.$apply();
        expect(startCount).toBe(1);
      });

      it('should send only send on matched open', function () {
        expect(startCount).toBe(0);
        dialogEvents.notifyOpened();
        dialogEvents.notifyOpened();
        dialogEvents.notifyOpened();
        $scope.$apply();
        expect(startCount).toBe(1);
      });

      it('should send closed event', function () {
        expect(endCount).toBe(0);
        dialogEvents.notifyOpened();
        dialogEvents.notifyClosed();
        $scope.$apply();
        expect(endCount).toBe(1);
      });

      it('should send only send on matched closed', function () {
        expect(endCount).toBe(0);
        dialogEvents.notifyOpened();
        dialogEvents.notifyClosed();
        dialogEvents.notifyClosed();
        dialogEvents.notifyClosed();
        $scope.$apply();
        expect(endCount).toBe(1);
      });

      it('should send only send on matched pairs of open/close', function () {
        expect(startCount).toBe(0);
        expect(endCount).toBe(0);
        dialogEvents.notifyOpened();
        dialogEvents.notifyClosed();
        $scope.$apply();
        dialogEvents.notifyOpened();
        dialogEvents.notifyClosed();
        $scope.$apply();
        dialogEvents.notifyOpened();
        dialogEvents.notifyClosed();
        $scope.$apply();
        expect(startCount).toBe(3);
        expect(endCount).toBe(3);
      });

    });
  });

})();
