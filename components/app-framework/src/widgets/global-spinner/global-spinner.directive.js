(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('globalSpinner', globalSpinner);

  function globalSpinner($document) {
    return {
      bindToController: {
        classes: '@?',
        spinnerActive: '=',
        spinnerType: '@?',
        spinnerLabel: '=?',
        spinnerLocal: '=?'
      },
      controller: GlobalSpinnerController,
      controllerAs: 'globalSpinnerCtrl',
      link: function (scope, element, attrs, ctrl) {
        // Check to see if other spinners are already active
        if (!ctrl.spinnerLocal) {
          scope.$watch('spinnerActive', function (spinnerActive) {
            if (spinnerActive) {
              $document.find('body').addClass('global-spinner-active');
            } else {
              $document.find('body').removeClass('global-spinner-active');
            }
          });
        }
      },
      scope: {},
      templateUrl: 'framework/widgets/global-spinner/global-spinner.html',
      transclude: true
    };
  }

  function GlobalSpinnerController() {
    this.classes = this.classes || '';
    this.spinnerType = this.spinnerType || 'spinner';
  }

})();
