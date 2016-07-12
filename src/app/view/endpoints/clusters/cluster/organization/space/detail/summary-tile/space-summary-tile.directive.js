(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail')
    .directive('spaceSummaryTile', SpaceSummaryTile);

  SpaceSummaryTile.$inject = [];

  function SpaceSummaryTile() {
    return {
      bindToController: {
        clusterGuid: '=',
        space: '='
      },
      controller: SpaceSummaryTileController,
      controllerAs: 'spaceSummaryTileCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/space/detail/summary-tile/space-summary-tile.html'
    };
  }

  SpaceSummaryTileController.$inject = [
    '$state'
  ];

  /**
   * @name SpaceSummaryTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function SpaceSummaryTileController($state) {
    this.$state = $state;
    this.cardData = {
      title: gettext('Summary')
    };
    this.actions = [
      {
        name: gettext('Edit Space'),
        execute: function () {
          alert('Edit Space');
        }
      },
      {
        name: gettext('Delete Space'),
        execute: function () {
          alert('Delete Space');
        }
      }
    ];
  }

  angular.extend(SpaceSummaryTileController.prototype, {
  });

})();
