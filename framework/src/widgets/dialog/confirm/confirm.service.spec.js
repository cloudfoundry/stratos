(function () {
  'use strict';

  describe('confirm service', function () {
    var confirmDialog, confirmDialogContext;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));
    beforeEach(module('ui.bootstrap'));

    beforeEach(inject(function ($injector) {
      confirmDialog = $injector.get('helion.framework.widgets.dialog.confirm');
      confirmDialogContext = {
        title: 'Are you sure?',
        description: 'Please confirm.',
        buttonText: {
          yes: 'Yes, I am sure',
          no: 'No'
        },
        callback: function () {
        }
      };
      confirmDialog(confirmDialogContext);
    }));

    it('confirm is defined as function', function () {
      expect(angular.isFunction(confirmDialog)).toBe(true);
    });

    it('context was attached with a modalInstance', function () {
      expect(confirmDialogContext.modalInstance).toBeDefined();
    });
  });

})();
