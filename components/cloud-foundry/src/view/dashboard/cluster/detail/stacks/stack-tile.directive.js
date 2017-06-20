(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('stackTile', StackTile);

  function StackTile() {
    return {
      bindToController: {
        stack: '='
      },
      controller: StackTileController,
      controllerAs: 'stackTileCtrl',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/stacks/stack-tile.html'
    };
  }

  /**
   * @name StackTileController
   * @constructor
   */
  function StackTileController() {
    var vm = this;
    vm.cardData = {
      stack: vm.stack,
      title: vm.stack.entity.name
    };
  }

})();
