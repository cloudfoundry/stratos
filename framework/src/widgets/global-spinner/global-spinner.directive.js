(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('globalSpinner', globalSpinner);

  globalSpinner.$inject = [
    '$document'
  ];

  function globalSpinner($document) {
    return {
      bindToController: {
        classes: '@?',
        spinnerActive: '=',
        spinnerType: '@?'
      },
      controller: GlobalSpinnerController,
      controllerAs: 'globalSpinnerCtrl',
      link: function (scope) {
        scope.$watch('spinnerActive', function (spinnerActive) {
          if (spinnerActive) {
            $document.find('body').addClass('global-spinner-active');
          } else {
            $document.find('body').removeClass('global-spinner-active');
          }
        });
      },
      scope: {},
      templateUrl: 'widgets/global-spinner/global-spinner.html',
      transclude: true
    };
  }

  function GlobalSpinnerController() {
    this.classes = this.classes || '';
    this.spinnerType = this.spinnerType || 'spinner';
  }

})();
