(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .factory('app.view.userSelection', userSelectionFactory);

  userSelectionFactory.$inject = [];

  /**
   * @namespace app.view.userSelection
   * @memberof app.view
   * @name utilsService
   * @description service centralizing user selection
   * @param {object} $log - the Angular $log service
   * @returns {object} the utils service
   */
  function userSelectionFactory() {
    var that = this;

    this.selectedUsers = {};

    return {
      getSelectedUsers: getSelectedUsers,
      selectUsers: selectUsers,
      deselectUsers: deselectUsers,
      deselectAllUsers: deselectAllUsers,
      isAllSelected: isAllSelected,
      deselectInvisibleUsers: deselectInvisibleUsers
    };

    function _initSelection(cnsiGuid) {
      if (angular.isUndefined(that.selectedUsers[cnsiGuid])) {
        that.selectedUsers[cnsiGuid] = {};
      }
    }

    function getSelectedUsers(cnsiGuid) {
      _initSelection(cnsiGuid);
      return that.selectedUsers[cnsiGuid];
    }

    function selectUsers(cnsiGuid) {
      var users = Array.prototype.slice.call(arguments, 1);
      _initSelection(cnsiGuid);

      // Support varargs or array syntax
      if (users.length === 1 && _.isArray(users[0])) {
        users = users[0];
      }

      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var userKey;
        // Count anything without a username as un-editable
        if (angular.isUndefined(user.entity.username)) {
          continue;
        }
        // Support selecting by guid or Object
        if (_.isString(user)) {
          userKey = user;
        } else {
          userKey = user.metadata.guid;
        }
        that.selectedUsers[cnsiGuid][userKey] = true;
      }
    }

    function isAllSelected(cnsiGuid) {
      var users = Array.prototype.slice.call(arguments, 1);
      _initSelection(cnsiGuid);

      // Support varargs or array syntax
      if (users.length === 1 && _.isArray(users[0])) {
        users = users[0];
      }

      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var userKey;
        // Ignore anything without a username
        if (angular.isUndefined(user.entity.username)) {
          continue;
        }
        // Support checking by guid or Object
        if (_.isString(user)) {
          userKey = user;
        } else {
          userKey = user.metadata.guid;
        }
        if (!that.selectedUsers[cnsiGuid][userKey]) {
          return false;
        }
      }
      return true;
    }

    function deselectUsers(cnsiGuid) {
      var users = Array.prototype.slice.call(arguments, 1);
      _initSelection(cnsiGuid);

      // Support varargs or array syntax
      if (users.length === 1 && _.isArray(users[0])) {
        users = users[0];
      }

      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var userKey;
        // Ignore anything without a username
        if (angular.isUndefined(user.entity.username)) {
          continue;
        }
        // Support deselecting by guid or Object
        if (_.isString(user)) {
          userKey = user;
        } else {
          userKey = user.metadata.guid;
        }
        delete that.selectedUsers[cnsiGuid][userKey];
      }
    }

    function deselectAllUsers(cnsiGuid) {
      _initSelection(cnsiGuid);
      for (var userGuid in that.selectedUsers[cnsiGuid]) {
        if (!that.selectedUsers[cnsiGuid].hasOwnProperty(userGuid)) { continue; }
        delete that.selectedUsers[cnsiGuid][userGuid];
      }
    }

    function deselectInvisibleUsers(cnsiGuid, visibleUsers) {
      _initSelection(cnsiGuid);
      var selectUsersGuids = _.invert(that.selectedUsers[cnsiGuid], true).true;
      var visibleUsersGuids = _.map(visibleUsers, function (user) {
        return user.metadata.guid;
      });
      var invisibleUsers = _.differenceBy(selectUsersGuids, visibleUsersGuids);
      deselectUsers(cnsiGuid, invisibleUsers);
    }

  }

})();
