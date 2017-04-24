(function () {
  'use strict';

  describe('notifications service', function () {
    var notifications, frameworkToaster;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      notifications = $injector.get('appNotificationsService');
      frameworkToaster = $injector.get('frameworkToaster');
    }));

    describe('notify method', function () {

      it('should be defined', function () {
        expect(notifications).toBeDefined();
        expect(notifications.notify).toBeDefined();
      });

      it('show busy toast', function () {
        spyOn(frameworkToaster, 'busy');
        notifications.notify('busy', 'test_message');
        expect(frameworkToaster.busy).toHaveBeenCalled();
      });

      it('show error toast', function () {
        spyOn(frameworkToaster, 'error');
        notifications.notify('error', 'test_message');
        expect(frameworkToaster.error).toHaveBeenCalled();
      });

      it('show success toast', function () {
        spyOn(frameworkToaster, 'success');
        notifications.notify('success', 'test_message');
        expect(frameworkToaster.success).toHaveBeenCalled();
      });

      it('show warning toast', function () {
        spyOn(frameworkToaster, 'warning');
        notifications.notify('warning', 'test_message');
        expect(frameworkToaster.warning).toHaveBeenCalled();
      });

      it('show custom toast', function () {
        spyOn(frameworkToaster, 'show');
        notifications.notify('custom', 'test_message');
        expect(frameworkToaster.show).toHaveBeenCalled();
      });

    });

    describe('events', function () {

      var appEventService;

      beforeEach(inject(function ($injector) {
        appEventService = $injector.get('appEventService');
      }));

      var eventData = {
        message: 'test message',
        options: {}
      };

      it('show busy toast', function () {
        spyOn(frameworkToaster, 'busy');
        appEventService.$emit('events.NOTIFY_BUSY', eventData);
        expect(frameworkToaster.busy).toHaveBeenCalled();
      });

      it('show error toast', function () {
        spyOn(frameworkToaster, 'error');
        appEventService.$emit('events.NOTIFY_ERROR', eventData);
        expect(frameworkToaster.error).toHaveBeenCalled();
      });

      it('show success toast', function () {
        spyOn(frameworkToaster, 'success');
        appEventService.$emit('events.NOTIFY_SUCCESS', eventData);
        expect(frameworkToaster.success).toHaveBeenCalled();
      });

      it('show warning toast', function () {
        spyOn(frameworkToaster, 'warning');
        appEventService.$emit('events.NOTIFY_WARNING', eventData);
        expect(frameworkToaster.warning).toHaveBeenCalled();
      });

      it('show custom toast', function () {
        spyOn(frameworkToaster, 'show');
        appEventService.$emit('events.NOTIFY', eventData);
        expect(frameworkToaster.show).toHaveBeenCalled();
      });

    });

  });

})();
