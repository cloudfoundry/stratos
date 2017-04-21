(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster')
    .directive('selectedUsersList', SelectedUsersList);

  function SelectedUsersList() {
    return {
      bindToController: {
        selectedUsers: '=',
        maxVisibleUsers: '@'
      },
      controller: SelectedUsersListController,
      controllerAs: 'usersListCtrl',
      scope: {},
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/actions/selected-users-list/selected-users-list.html'
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
