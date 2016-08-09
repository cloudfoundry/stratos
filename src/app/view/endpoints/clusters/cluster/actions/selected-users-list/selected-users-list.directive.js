(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .directive('selectedUsersList', SelectedUsersList);

  SelectedUsersList.$inject = [];

  function SelectedUsersList() {
    return {
      bindToController: {
        selectedUsers: '=',
        maxVisibleUsers: '@'
      },
      controller: SelectedUsersListController,
      controllerAs: 'usersListCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/cluster/actions/selected-users-list/selected-users-list.html'
    };
  }

  /**
   * @name SelectedUsersListController
   * @description Shows list of users up to maxVisibleUsers. User can toggle all visible.
   * @constructor
   */
  function SelectedUsersListController() {
    var that = this;

    this.maxVisibleUsers = this.maxVisibleUsers || 10;
    this.numberMaxValue = Number.MAX_SAFE_INTEGER;

    this.selectedUserCount = function () {
      return _.keys(that.selectedUsers).length;
    };
  }

})();
