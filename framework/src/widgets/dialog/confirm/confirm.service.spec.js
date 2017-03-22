(function () {
  'use strict';

  describe('confirm service', function () {
    var $rootScope, $q, $sce, $timeout, confirmDialog, confirmDialogContext, service;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));
    beforeEach(module('ui.bootstrap'));

    beforeEach(inject(function ($injector) {
      $timeout = $injector.get('$timeout');
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');
      $sce = $injector.get('$sce');
      confirmDialog = $injector.get('helion.framework.widgets.dialog.confirm');
      confirmDialogContext = {
        noHtmlEscape: true,
        title: $sce.trustAsHtml('Are you sure?'),
        description: $sce.trustAsHtml('Please confirm.'),
        buttonText: {
          yes: 'Yes, I am sure',
          no: 'No'
        },
        callback: function () {
        }
      };
      service = confirmDialog(confirmDialogContext);
    }));

    it('confirm is defined as function', function () {
      expect(angular.isFunction(confirmDialog)).toBe(true);
    });

    it('context was attached with a modalInstance', function () {
      expect(confirmDialogContext.modalInstance).toBeDefined();
    });

    it('should close dialog when ok pressed', function () {
      service.result.catch(function () {
        fail('dailog should close ok');
      });
      $rootScope.$apply();
      angular.element('.btn.btn-primary').trigger('click');
      $timeout.flush();
    });

    it('should close dialog when cancel pressed', function () {
      service.result.then(function () {
        fail('dailog should close cancel');
      });
      $rootScope.$apply();
      angular.element('.btn.btn-default').trigger('click');
      $timeout.flush();
    });

    it('should show error when callback fails', function () {
      confirmDialogContext.callback = function () {
        return $q.reject();
      };

      $rootScope.$apply();
      angular.element('.btn.btn-primary').trigger('click');
      $timeout.flush();
    });

    it('should get error when callback fails', function () {
      confirmDialogContext.callback = function () {
        return $q.reject({
          data: {
            description: 'error_msg'
          }
        });
      };

      $rootScope.$apply();
      angular.element('.btn.btn-primary').trigger('click');
      $timeout.flush();
      expect(angular.element('.modal-error .alert.alert-danger').text().trim()).toBe('error_msg');
    });

    it('should get error when callback fails - get description', function () {
      confirmDialogContext.callback = function () {
        return $q.reject({
          description: 'error_msg2'
        });
      };

      $rootScope.$apply();
      angular.element('.btn.btn-primary').trigger('click');
      $timeout.flush();
      expect(angular.element('.modal-error .alert.alert-danger').text().trim()).toBe('error_msg2');
    });

    it('should get error when callback fails - default', function () {
      confirmDialogContext.errorMessage = 'msg';
      confirmDialogContext.callback = function () {
        return $q.reject({});
      };

      $rootScope.$apply();
      angular.element('.btn.btn-primary').trigger('click');
      $timeout.flush();
      expect(angular.element('.modal-error .alert.alert-danger').text().trim()).toBe('msg');
    });

    it('should close when there is no callback', function () {
      confirmDialogContext.callback = undefined;
      confirmDialogContext.windowClass = 'test';
      confirmDialogContext.description = function () {
        return $sce.trustAsHtml('Description');
      };
      service = confirmDialog(confirmDialogContext);
      $rootScope.$apply();
      angular.element('.btn.btn-primary').trigger('click');
      $timeout.flush();
      $rootScope.$apply();
    });
  });
})();
