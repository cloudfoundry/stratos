(function () {
  'use strict';

  describe('toaster notification service', function () {

    var frameworkToaster, $scope, $timeout, $sce;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      $scope = $injector.get('$rootScope');
      $timeout = $injector.get('$timeout');
      frameworkToaster = $injector.get('frameworkToaster');
      $sce = $injector.get('$sce');
    }));

    it('should be defined', function () {
      expect(frameworkToaster).toBeDefined();
    });

    it('success toast', function () {
      expect(frameworkToaster.success).toBeDefined();
      var toast = frameworkToaster.success('test message 1');
      expect(toast).toBeDefined();
      expect(toast.scope).toBeDefined();
      expect(toast.scope.options.titleClass).toBe('toast-success');
      expect($sce.valueOf(toast.scope.message)).toBe('test message 1');
    });

    it('warning toast', function () {
      expect(frameworkToaster.warning).toBeDefined();
      var toast = frameworkToaster.warning('test message 2');
      expect(toast).toBeDefined();
      expect(toast.scope).toBeDefined();
      expect(toast.scope.options.titleClass).toBe('toast-warning');
      expect($sce.valueOf(toast.scope.message)).toBe('test message 2');
    });

    it('error toast', function () {
      expect(frameworkToaster.error).toBeDefined();
      var toast = frameworkToaster.error('test message 3');
      expect(toast).toBeDefined();
      expect(toast.scope).toBeDefined();
      expect(toast.scope.options.titleClass).toBe('toast-error');
      expect($sce.valueOf(toast.scope.message)).toBe('test message 3');
    });

    it('custom toast', function () {
      expect(frameworkToaster.show).toBeDefined();
      var toast = frameworkToaster.show('test message 4', 'custom-icon');
      expect(toast).toBeDefined();
      expect(toast.scope).toBeDefined();
      expect(toast.scope.options.titleClass).toBe('custom-icon');
      expect($sce.valueOf(toast.scope.message)).toBe('test message 4');
    });

    it('busy toast', function (done) {
      expect(frameworkToaster.busy).toBeDefined();
      var toast = frameworkToaster.busy('test busy message');
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
