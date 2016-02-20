(function () {
  'use strict';

  describe('service registration controller', function () {
    var ctrl;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $controller = $injector.get('$controller');
      ctrl = $controller('serviceRegistrationController');

      spyOn(ctrl.eventService, '$emit');
    }));

    it('should be defined', function () {
      expect(ctrl).toBeDefined();
    });

    it('should have `account` property defined', function () {
      expect(ctrl.account).toBeDefined();
    });

    it('should have `eventService` property defined', function () {
      expect(ctrl.eventService).toBeDefined();
    });

    it('should emit LOGGED_IN event on registration complete', function () {
      ctrl.completeRegistration();
      expect(ctrl.eventService.$emit).toHaveBeenCalledWith('LOGGED_IN');
    });
  });

})();
