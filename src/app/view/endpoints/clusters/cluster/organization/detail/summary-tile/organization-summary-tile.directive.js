(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.detail')
    .directive('organizationSummaryTile', OrganizationSummaryTile);

  OrganizationSummaryTile.$inject = [];

  function OrganizationSummaryTile() {
    return {
      bindToController: {
        clusterGuid: '=',
        organization: '='
      },
      controller: OrganizationSummaryTileController,
      controllerAs: 'organizationSummaryTileCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/summary-tile/organization-summary-tile.html'
    };
  }

  OrganizationSummaryTileController.$inject = [
    '$state'
  ];

  /**
   * @name OrganizationSummaryTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationSummaryTileController($state) {
    this.$state = $state;
    this.cardData = {
      title: gettext('Summary')
    };
    this.actions = [
      {
        name: gettext('Edit Organization'),
        execute: function () {
          alert('Edit Organization');
        }
      },
      {
        name: gettext('Delete Organization'),
        execute: function () {
          alert('Delete Organization');
        }
      }
    ];
  }

  angular.extend(OrganizationSummaryTileController.prototype, {
  });

})();
