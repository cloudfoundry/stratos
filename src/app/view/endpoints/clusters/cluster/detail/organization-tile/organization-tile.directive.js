(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('organizationTile', OrganizationTile);

  OrganizationTile.$inject = [];

  function OrganizationTile() {
    return {
      bindToController: {
        organization: '='
      },
      controller: OrganizationTileController,
      controllerAs: 'organizationTileCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/organization-tile/organization-tile.html'
    };
  }

  OrganizationTileController.$inject = [
    '$state'
  ];

  /**
   * @name OrganizationTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationTileController($state) {
    this.$state = $state;
    this.actions = [];
    this.setActions();

    console.log('organizationTileCtrl.organization.name', JSON.stringify(this.organization));
  }

  angular.extend(OrganizationTileController.prototype, {

    setActions: function () {
      this.actions.push({
        name: 'Test',
        execute: function () {
          console.log('Test');
        }
      });
    },

    summary: function () {
      console.log('This is', this);
    }

  });

})();
