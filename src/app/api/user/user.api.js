(function () {
  'use strict';

  /**
   * @namespace app.api.user
   * @memberof app.api
   * @name user
   * @description User API
   */
  angular
    .module('app.api')
    .run(registerUserApi);

  registerUserApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerUserApi($http, apiManager) {
    apiManager.register('app.api.user', new UserApi($http));
  }

  /**
   * @namespace app.api.user.UserApi
   * @memberof app.api.user
   * @name UserApi
   * @param {object} $http - the Angular $http service
   * @property {object} $http - the Angular $http service
   * @class
   */
  function UserApi($http) {
    this.$http = $http;
  }

  angular.extend(UserApi.prototype, {
    /**
     * @function create
     * @memberof app.api.user.UserApi
     * @description Create a user and set user as registered
     * @param {object} userData - the user data
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    create: function (userData) {
      return this.$http.post('/api/users', userData || {});
    },

    /**
     * @function getLoggedInUser
     * @memberof app.api.user.UserApi
     * @description Get logged in user
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    getLoggedInUser: function () {
      return this.$http.get('/api/users/loggedIn');
    },

    /**
     * @function remove
     * @memberof app.api.user.UserApi
     * @description Remove user
     * @param {number} id - the user ID
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    remove: function (id) {
      return this.$http.delete('/api/users/' + id);
    },

    /**
     * @function update
     * @memberof app.api.user.UserApi
     * @description Update user
     * @param {number} id - the user ID
     * @param {object} newData - the new data to update with
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    update: function (id, newData) {
      return this.$http.put('/api/users/' + id, newData);
    }
  });

})();
