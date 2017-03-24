(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('bounceSpinner', bounceSpinner);

  bounceSpinner.$inject = ['helion.framework.basePath'];

  /**
   * @name bounceSpinner
   * @description A loading three bounce spinner directive
   * @param {string} path - the framework base path
   * @returns {*}
   * @example
   * <bounce-spinner></bounce-spinner>
   */
  function bounceSpinner(path) {
    return {
      bindToController: {
        classes: '@?'
      },
      controller: BounceSpinnerController,
      controllerAs: 'bounceSpinnerCtrl',
      scope: {},
      templateUrl: path + 'widgets/bounce-spinner/bounce-spinner.html'
    };
  }

  function BounceSpinnerController() {
    this.classes = this.classes || '';
  }

})();
