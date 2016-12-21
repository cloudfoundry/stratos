(function () {
  'use strict';

  describe('notifications service', function () {
    var notifications, toaster;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      notifications = $injector.get('app.view.notificationsService');
      toaster = $injector.get('helion.framework.widgets.toaster');
    }));

    describe('notify method', function () {

      it('should be defined', function () {
        expect(notifications).toBeDefined();
        expect(notifications.notify).toBeDefined();
      });

      it('show busy toast', function () {
        spyOn(toaster, 'busy');
        notifications.notify('busy', 'test_message');
        expect(toaster.busy).toHaveBeenCalled();
      });

      it('show error toast', function () {
        spyOn(toaster, 'error');
        notifications.notify('error', 'test_message');
        expect(toaster.error).toHaveBeenCalled();
      });

      it('show success toast', function () {
        spyOn(toaster, 'success');
        notifications.notify('success', 'test_message');
        expect(toaster.success).toHaveBeenCalled();
      });

      it('show warning toast', function () {
        spyOn(toaster, 'warning');
        notifications.notify('warning', 'test_message');
        expect(toaster.warning).toHaveBeenCalled();
      });

      it('show custom toast', function () {
        spyOn(toaster, 'show');
        notifications.notify('custom', 'test_message');
        expect(toaster.show).toHaveBeenCalled();
      });

    });

    describe('events', function () {

      var eventService;

      beforeEach(inject(function ($injector) {
        eventService = $injector.get('app.event.eventService');
      }));

      var eventData = {
        message: 'test message',
        options: {}
      };

      it('show busy toast', function () {
        spyOn(toaster, 'busy');
        eventService.$emit('cf.events.NOTIFY_BUSY', eventData);
        expect(toaster.busy).toHaveBeenCalled();
      });

      it('show error toast', function () {
        spyOn(toaster, 'error');
        eventService.$emit('cf.events.NOTIFY_ERROR', eventData);
        expect(toaster.error).toHaveBeenCalled();
      });

      it('show success toast', function () {
        spyOn(toaster, 'success');
        eventService.$emit('cf.events.NOTIFY_SUCCESS', eventData);
        expect(toaster.success).toHaveBeenCalled();
      });

      it('show warning toast', function () {
        spyOn(toaster, 'warning');
        eventService.$emit('cf.events.NOTIFY_WARNING', eventData);
        expect(toaster.warning).toHaveBeenCalled();
      });

      it('show custom toast', function () {
        spyOn(toaster, 'show');
        eventService.$emit('cf.events.NOTIFY', eventData);
        expect(toaster.show).toHaveBeenCalled();
      });

    });

  });

})();
