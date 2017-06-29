(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('appInstanceSelector', appInstanceSelector);

  /**
   * @namespace app.framework.widgets.appInstanceSelector
   * @memberof app.framework.widgets
   * @name appInstanceSelector
   * @returns {object} The App Instance Selector directive definition object
   */
  function appInstanceSelector() {
    return {
      bindToController: {
        instance: '=',
        shown: '='
      },
      controller: AppInstanceSelectorController,
      controllerAs: 'aiSelectCtrl',
      restrict: 'E',
      templateUrl: 'cf-app-ssh/view/instance-selector/instance-selector.html'
    };
  }

  /**
   * @namespace app.framework.widgets.AppInstanceSelectorController
   * @memberof app.framework.widgets
   * @name ActionsMenuController
   * @constructor
   * @param {modelManager} modelManager - the model manager service
   * @param {cfUtilsService} cfUtilsService - the cfUtilsService service
   */
  function AppInstanceSelectorController(modelManager, cfUtilsService) {
    var vm = this;
    vm.cfUtilsService = cfUtilsService;
    vm.model = modelManager.retrieve('cloud-foundry.model.application');
    vm.selectItem = function (instance) {
      vm.instance = instance;
      vm.shown = false;
    };
  }

})();
