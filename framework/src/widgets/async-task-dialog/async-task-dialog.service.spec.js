(function (global) {
  'use strict';

  var delay = 10;
  var successfulActionPromise = function ($q, $timeout) {
    var deferred = $q.defer();
    $timeout(deferred.resolve, delay);
    // return deferred.promise;
    return deferred.promise;
  };

  var rejectedActionPromise = function ($q, $timeout) {
    var deferred = $q.defer();
    $timeout(deferred.reject, delay);
    // return deferred.promise;
    return deferred.promise;
  };

  describe('async task dialog service', function () {
    var asynTaskDialog;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));
    beforeEach(module('ui.bootstrap'));

    beforeEach(inject(function ($injector) {
      var $rootScope = $injector.get('$rootScope');
      asynTaskDialog = $injector.get('helion.framework.widgets.asyncTaskDialog');
      var $timeout = $injector.get('$timeout');
      var $q = $injector.get('$q');
      var content = {
        title: 'Title',
        templateUrl: ''
      };
      var context = {
        test: '123456e'
      };
      global.gettext = function (message) {
        return message;
      };
      asynTaskDialog(content, context, _.partial(successfulActionPromise, $q, $timeout));
      $rootScope.$digest();
    }));

    it('asyncTaskDialog is defined as function', function () {
      expect(angular.isFunction(asynTaskDialog)).toBe(true);
    });
  });

  describe('async task dialog controller', function () {
    var asyncTaskDialogController, $timeout;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));
    beforeEach(module('ui.bootstrap'));

    beforeEach(inject(function ($injector) {
      var $controller = $injector.get('$controller');
      var $rootScope = $injector.get('$rootScope');
      var $scope = $rootScope.$new();
      $timeout = $injector.get('$timeout');
      var $q = $injector.get('$q');
      var context = {
        test: '123456e',
        submitAction: _.partial(successfulActionPromise, $q, $timeout)
      };
      asyncTaskDialogController = $controller('AsyncTaskDialogController',
        {
          $scope: $scope,
          context: context,
          content: {},
          $uibModalInstance: {
            close: _.noop
          }
        });
      $rootScope.$digest();

    }));

    it('asyncTaskDialogController is defined as function', function () {
      expect(asyncTaskDialogController).toBeDefined();
    });

    it('should show spinner after invoking action', function () {
      asyncTaskDialogController.invokeAction();
      expect(asyncTaskDialogController.showSpinner).toBe(true);
      $timeout(function () {
        expect(asyncTaskDialogController.showSpinner).toBe(false);
      }, delay * 2);
    });
  });

  describe('async task dialog controller', function () {
    var asyncTaskDialogController, $timeout;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));
    beforeEach(module('ui.bootstrap'));

    beforeEach(inject(function ($injector) {
      var $controller = $injector.get('$controller');
      var $rootScope = $injector.get('$rootScope');
      var $scope = $rootScope.$new();
      $timeout = $injector.get('$timeout');
      var $q = $injector.get('$q');
      var context = {
        test: '123456e',
        submitAction: _.partial(rejectedActionPromise, $q, $timeout)
      };

      asyncTaskDialogController = $controller('AsyncTaskDialogController',
        {
          $scope: $scope,
          context: context,
          content: {},
          $uibModalInstance: {
            close: _.noop
          }
        });
      $rootScope.$digest();
    }));

    it('asyncTaskDialogController is defined', function () {
      expect(asyncTaskDialogController).toBeDefined();
    });

    it('should show spinner after invoking action', function () {
      asyncTaskDialogController.invokeAction();
      expect(asyncTaskDialogController.showSpinner).toBe(true);
      $timeout(function () {
        expect(asyncTaskDialogController.showSpinner).toBe(false);
        expect(asyncTaskDialogController.showErrorBar).toBe(true);
      }, delay * 2);
    });
  });

})(this);
