(function () {
  'use strict';

  /**
   * @namespace app.model.serviceInstance.user
   * @memberOf app.model.serviceInstance
   * @name user
   * @description User service instance model
   */
  angular
    .module('app.model')
    .run(registerUserServiceInstanceModel);

  registerUserServiceInstanceModel.$inject = [
    '$q',
    'app.api.apiManager',
    'app.model.modelManager'
  ];

  function registerUserServiceInstanceModel($q, apiManager, modelManager) {
    modelManager.register('app.model.serviceInstance.user', new UserServiceInstance($q, apiManager));
  }

  /**
   * @namespace app.model.serviceInstance.user.UserServiceInstance
   * @memberof app.model.serviceInstance.user
   * @name app.model.serviceInstance.user.UserServiceInstance
   * @param {object} $q - the Angular Promise service
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {object} serviceInstances - the service instances available to user
   * @property {number} numValid - the number of valid user service instances
   * @class
   */
  function UserServiceInstance($q, apiManager) {
    this.$q = $q;
    this.apiManager = apiManager;
    this.serviceInstances = {};
    this.numValid = 0;
  }

  angular.extend(UserServiceInstance.prototype, {
    /**
     * @function connect
     * @memberof app.api.serviceInstance.user.UserServiceInstance
     * @description Connect a service instance
     * @param {string} guid - the CNSI GUID
     * @param {string} name - the CNSI name
     * @param {string} username - the login username
     * @param {string} password - the login password
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    connect: function (guid, name, username, password) {
      var that = this;
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.connect(guid, username, password)
        .then(function (response) {
          that.onConnect(guid, name, response);
          return response;
        });
    },

    /**
     * @function verify
     * @memberof app.api.serviceInstance.user.UserServiceInstance
     * @description Verify credentials provided by user
     * @param {string} guid - the CNSI GUID
     * @param {string} name - the CNSI name
     * @param {string} username - the login username
     * @param {string} password - the login password
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    verify: function (guid, username, password) {
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.verify(guid, username, password)
        .then(function (response) {
          return response;
        });
    },

    /**
     * @function disconnect
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description Disconnect user from service instance
     * @param {number} guid - the CNSI GUID
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    disconnect: function (guid) {
      var that = this;
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.disconnect(guid)
        .then(function (response) {
          that.onDisconnect(guid);
          return response;
        });
    },

    /**
     * @function list
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description Returns services instances and number registered
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    list: function () {
      var that = this;
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance.user');
      var cfInfoApi = this.apiManager.retrieve('cloud-foundry.api.Info');
      var hceInfoApi = this.apiManager.retrieve('cloud-foundry.api.HceInfoApi');

      return serviceInstanceApi.list().then(function (response) {
        var items = response.data;

        that.serviceInstances = {};
        that.numValid = 0;

        var hcfGuids = _.map(_.filter(items, {cnsi_type: 'hcf'}) || [], 'guid') || [];
        var hcfCfg = {headers: {'x-cnap-cnsi-list': hcfGuids.join(',')}};
        var hceGuids = _.map(_.filter(items, {cnsi_type: 'hce'}) || [], 'guid') || [];

        var tasks = [];
        // call /v2/info to refresh tokens, then list
        if (hcfGuids.length > 0) {
          tasks.push(cfInfoApi.GetInfo({}, hcfCfg));
        }
        if (hceGuids.length > 0) {
          tasks.push(hceInfoApi.info(hceGuids.join(',')));
        }

        if (tasks.length === 0) {
          if (items.length > 0) {
            that.onList(response);
          }
          return that.serviceInstances;
        } else {
          // Swallow errors - we don't want one failure to fail everything
          return that.$q.all(tasks).catch(angular.noop).then(function () {
            return serviceInstanceApi.list().then(function (listResponse) {
              that.onList(listResponse);
              return that.serviceInstances;
            });
          });
        }
      });

    },

    /**
     * @function register
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description Set the service instances as registered
     * @param {array} urls - the service instance endpoints
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    register: function (urls) {
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.register(urls);
    },

    /**
     * @function onConnect
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description onConnect handler
     * @param {string} guid - the CNSI GUID
     * @param {string} name - the CNSI name
     * @param {object} response - the HTTP response
     * @returns {void}
     * @private
     */
    onConnect: function (guid, name, response) {
      var newCnsi = response.data;
      newCnsi.guid = guid;
      newCnsi.name = name;
      newCnsi.valid = true;

      if (angular.isUndefined(this.serviceInstances[guid])) {
        this.serviceInstances[guid] = newCnsi;
      } else {
        angular.extend(this.serviceInstances[guid], newCnsi);
      }
    },

    /**
     * @function onDisconnect
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description onDisconnect handler
     * @param {string} guid - the CNSI GUID
     * @returns {void}
     * @private
     */
    onDisconnect: function (guid) {
      if (angular.isDefined(this.serviceInstances[guid])) {
        delete this.serviceInstances[guid];
      }
    },

    onList: function (response) {
      var items = response.data;

      // check token expirations
      var now = (new Date()).getTime() / 1000;
      angular.forEach(items, function (item) {
        if (!_.isNil(item.token_expiry)) {
          item.valid = item.token_expiry > now;
        }
      });

      this.serviceInstances = _.keyBy(items, 'guid');
      this.numValid = _.sumBy(items, function (o) { return o.valid ? 1 : 0; }) || 0;
    }
  });

})();
