(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('bounceSpinner', bounceSpinner);

  /**
   * @name bounceSpinner
   * @description A loading three bounce spinner directive
   * @returns {*}
   * @example
   * <bounce-spinner></bounce-spinner>
   */
  function bounceSpinner() {
    return {
      bindToController: {
        classes: '@?'
      },
      controller: BounceSpinnerController,
      controllerAs: 'bounceSpinnerCtrl',
      scope: {},
      templateUrl: 'framework/widgets/bounce-spinner/bounce-spinner.html'
    };
  }

  function BounceSpinnerController() {
    this.classes = this.classes || '';
  }

})();
