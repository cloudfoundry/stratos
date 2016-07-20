(function () {
  'use strict';

  describe('account-actions directive', function () {
    var $element, accountActionsCtrl;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();
      var markup = '<account-actions></account-actions>';

      $element = angular.element(markup);
      $compile($element)($scope);
      $scope.$apply();

      accountActionsCtrl = $element.controller('accountActions');
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    describe('An AccountActionsController instance', function () {
      it('should be defined', function () {
        expect(accountActionsCtrl).toBeDefined();
      });

      // property definitions

      it('should have properties `stackatoInfo` defined', function () {
        expect(accountActionsCtrl.stackatoInfo).toBeDefined();
      });

    });

  });

})();
