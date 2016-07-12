(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space')
    .directive('organizationSpaceTile', OrganizationSpaceTile);

  OrganizationSpaceTile.$inject = [];

  function OrganizationSpaceTile() {
    return {
      bindToController: {
        space: '='
      },
      controller: OrganizationSpaceTileController,
      controllerAs: 'organizationSpaceTileCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/spaces/space-tile/organization-space-tile.html'
    };
  }

  OrganizationSpaceTileController.$inject = [
    '$state'
  ];

  /**
   * @name OrganizationSpaceTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationSpaceTileController($state) {
    this.$state = $state;
    this.cardData = {
      title: this.space.entity.name
    };
    this.actions = [
      {
        name: gettext('Edit Space'),
        execute: function () {
          alert('Edit Space');
        }
      }, {
        name: gettext('Delete Space'),
        execute: function () {
          alert('Delete Space');
        }
      },
      {
        name: gettext('Assign User(sa)'),
        execute: function () {
          alert('Assign User(s)');
        }
      }
    ];
  }

  angular.extend(OrganizationSpaceTileController.prototype, {

    summary: function () {
      this.$state.go('endpoint.clusters.cluster.organization.space.detail.services', {space: this.space.metadata.guid});
    }

  });

})();
