(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('buildpackTile', BuildpackTile);

  function BuildpackTile() {
    return {
      bindToController: {
        buildpack: '='
      },
      controller: BuildpackTileController,
      controllerAs: 'bpTileCtrl',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/buildpacks/buildpack-tile.html'
    };
  }

  /**
   * @name BuildpackTileController
   * @constructor
   */
  function BuildpackTileController() {
    var vm = this;
    vm.cardData = {
      buildpack: vm.buildpack,
      title: vm.buildpack.entity.name
    };
  }

})();
