(function () {
  'use strict';

  describe('error service', function () {
    var errorService;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      errorService = $injector.get('app.error.errorService');
    }));

    it('should set system error message', function () {
      expect(errorService.getError()).not.toBeDefined();
      errorService.setSystemError('TEST_SYSTEM_ERROR');
      expect(errorService.getError()).toBe('TEST_SYSTEM_ERROR');
    });

    it('should set application error message', function () {
      expect(errorService.getError()).not.toBeDefined();
      errorService.setAppError('TEST_APP_ERROR');
      expect(errorService.getError()).toBe('TEST_APP_ERROR');
    });

    it('should clear system error message', function () {
      expect(errorService.getError()).not.toBeDefined();
      errorService.setSystemError('TEST_SYSTEM_ERROR');
      expect(errorService.getError()).toBe('TEST_SYSTEM_ERROR');
      errorService.clearSystemError();
      expect(errorService.getError()).not.toBeDefined();
    });

    it('should clear application error message', function () {
      expect(errorService.getError()).not.toBeDefined();
      errorService.setAppError('TEST_APP_ERROR');
      expect(errorService.getError()).toBe('TEST_APP_ERROR');
      errorService.clearAppError();
      expect(errorService.getError()).not.toBeDefined();
    });

    it('should prioritize system error over application error message', function () {
      expect(errorService.getError()).not.toBeDefined();
      errorService.setAppError('TEST_APP_ERROR');
      expect(errorService.getError()).toBe('TEST_APP_ERROR');
      errorService.setSystemError('TEST_SYSTEM_ERROR');
      expect(errorService.getError()).toBe('TEST_SYSTEM_ERROR');
    });

    it('should prioritize system error over application error message - system set first', function () {
      expect(errorService.getError()).not.toBeDefined();
      errorService.setSystemError('TEST_SYSTEM_ERROR');
      expect(errorService.getError()).toBe('TEST_SYSTEM_ERROR');
      errorService.setAppError('TEST_APP_ERROR');
      expect(errorService.getError()).toBe('TEST_SYSTEM_ERROR');
    });

    it('should revert to application error when system error is cleared', function () {
      expect(errorService.getError()).not.toBeDefined();
      errorService.setAppError('TEST_APP_ERROR');
      expect(errorService.getError()).toBe('TEST_APP_ERROR');
      errorService.setSystemError('TEST_SYSTEM_ERROR');
      expect(errorService.getError()).toBe('TEST_SYSTEM_ERROR');
      errorService.clearSystemError();
      expect(errorService.getError()).toBe('TEST_APP_ERROR');
    });

    it('should revert to no error when both application and system errors are cleared', function () {
      expect(errorService.getError()).not.toBeDefined();
      errorService.setAppError('TEST_APP_ERROR');
      expect(errorService.getError()).toBe('TEST_APP_ERROR');
      errorService.setSystemError('TEST_SYSTEM_ERROR');
      expect(errorService.getError()).toBe('TEST_SYSTEM_ERROR');
      errorService.clearSystemError();
      expect(errorService.getError()).toBe('TEST_APP_ERROR');
      errorService.clearAppError();
      expect(errorService.getError()).not.toBeDefined();
    });
  });

})();
