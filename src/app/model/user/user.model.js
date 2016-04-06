(function () {
  'use strict';

  /**
   * @namespace app.model.user
   * @memberOf app.model
   * @name user
   * @description User model
   */
  angular
    .module('app.model')
    .run(registerUserModel);

  registerUserModel.$inject = [
    'app.api.apiManager',
    'app.model.modelManager'
  ];

  function registerUserModel(apiManager, modelManager) {
    modelManager.register('app.model.user', new User(apiManager));
  }

  /**
   * @namespace app.model.user.User
   * @memberof app.model.user
   * @name app.model.user.User
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {object} data - the user data
   * @class
   */
  function User(apiManager) {
    this.apiManager = apiManager;
    this.data = {};
  }

  angular.extend(User.prototype, {
    /**
     * @function create
     * @memberof app.model.user.User
     * @description Create a user
     * @param {object} userData - the user data
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    create: function (userData) {
      var that = this;
      var userApi = this.apiManager.retrieve('app.api.user');
      return userApi.create(userData)
        .then(function (response) {
          that.data = response.data;
          return that.data;
        });
    },

    /**
     * @function getLoggedInUser
     * @memberof app.model.user.User
     * @description Get logged in user
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    getLoggedInUser: function () {
      var that = this;
      var userApi = this.apiManager.retrieve('app.api.user');
      return userApi.getLoggedInUser()
        .then(function (response) {
          that.data = response.data;
          return that.data;
        });
    },

    /**
     * @function remove
     * @memberof app.model.user.User
     * @description Remove user
     * @param {number} id - the user ID
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    remove: function (id) {
      var userApi = this.apiManager.retrieve('app.api.user');
      return userApi.remove(id);
    },

    /**
     * @function update
     * @memberof app.model.user.User
     * @description Update user
     * @param {number} id - the user ID
     * @param {object} newData - the new data to update with
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    update: function (id, newData) {
      var that = this;
      var userApi = this.apiManager.retrieve('app.api.user');
      return userApi.update(id, newData)
        .then(function (response) {
          angular.extend(that.data, response.data);
        });
    },

    /**
     * @function updateRegistered
     * @memberof app.model.user.User
     * @description Unregister or register user
     * @param {boolean} registered - flag to indicate registered
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    updateRegistered: function (registered) {
      var that = this;
      var userApi = this.apiManager.retrieve('app.api.user');
      return userApi.update(this.data.id, { registered: registered })
        .then(function (response) {
          that.data.registered = response.data.registered;
        });
    }
  });

})();
