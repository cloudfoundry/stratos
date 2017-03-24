(function () {
  'use strict';

  describe('toaster notification service', function () {

    var toaster, $scope, $timeout, $sce;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      $scope = $injector.get('$rootScope');
      $timeout = $injector.get('$timeout');
      toaster = $injector.get('helion.framework.widgets.toaster');
      $sce = $injector.get('$sce');
    }));

    it('should be defined', function () {
      expect(toaster).toBeDefined();
    });

    it('success toast', function () {
      expect(toaster.success).toBeDefined();
      var toast = toaster.success('test message 1');
      expect(toast).toBeDefined();
      expect(toast.scope).toBeDefined();
      expect(toast.scope.options.titleClass).toBe('toast-success');
      expect($sce.valueOf(toast.scope.message)).toBe('test message 1');
    });

    it('warning toast', function () {
      expect(toaster.warning).toBeDefined();
      var toast = toaster.warning('test message 2');
      expect(toast).toBeDefined();
      expect(toast.scope).toBeDefined();
      expect(toast.scope.options.titleClass).toBe('toast-warning');
      expect($sce.valueOf(toast.scope.message)).toBe('test message 2');
    });

    it('error toast', function () {
      expect(toaster.error).toBeDefined();
      var toast = toaster.error('test message 3');
      expect(toast).toBeDefined();
      expect(toast.scope).toBeDefined();
      expect(toast.scope.options.titleClass).toBe('toast-error');
      expect($sce.valueOf(toast.scope.message)).toBe('test message 3');
    });

    it('custom toast', function () {
      expect(toaster.show).toBeDefined();
      var toast = toaster.show('test message 4', 'custom-icon');
      expect(toast).toBeDefined();
      expect(toast.scope).toBeDefined();
      expect(toast.scope.options.titleClass).toBe('custom-icon');
      expect($sce.valueOf(toast.scope.message)).toBe('test message 4');
    });

    it('busy toast', function (done) {
      expect(toaster.busy).toBeDefined();
      var toast = toaster.busy('test busy message');
      expect(toast).toBeDefined();
      expect(toast.scope).toBeDefined();
      expect(toast.scope.options.titleClass).toBe('');
      expect($sce.valueOf(toast.scope.message)).toBe('test busy message');
      $scope.$apply();
      $timeout(function () {
        toast.close().then(function () {
          done();
        });
        $timeout.flush();
      }, 500);
      $timeout.flush();
    });
  });

})();
