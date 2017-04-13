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

  function registerUserServiceInstanceModel($q, appUtilsService, apiManager, modelManager) {
    modelManager.register('app.model.serviceInstance.user', new UserServiceInstance($q, appUtilsService, apiManager));
  }

  /**
   * @namespace app.model.serviceInstance.user.UserServiceInstance
   * @memberof app.model.serviceInstance.user
   * @name app.model.serviceInstance.user.UserServiceInstance
   * @param {object} $q - the Angular Promise service
   * @param {app.utils.appUtilsService} appUtilsService - utils service
   * @param {app.api.apiManager} apiManager - the application API manager
   * @returns {object} UserServiceInstance
   */
  function UserServiceInstance($q, appUtilsService, apiManager) {
    var serviceInstances = {};
    var numValid = 0;

    return {
      serviceInstances: serviceInstances,
      getNumValid: getNumValid,
      connect: connect,
      verify: verify,
      disconnect: disconnect,
      list: list
    };

    function getNumValid() {
      return numValid;
    }

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
    function connect(guid, name, username, password) {
      var serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.connect(guid, username, password)
        .then(function (response) {
          onConnect(guid, name, response);
          return response;
        });
    }

    /**
     * @function verify
     * @memberof app.api.serviceInstance.user.UserServiceInstance
     * @description Verify credentials provided by user
     * @param {string} guid - the CNSI GUID
     * @param {string} username - the login username
     * @param {string} password - the login password
     * @returns {promise}
     * @public
     */
    function verify(guid, username, password) {
      var serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.verify(guid, username, password)
        .then(function (response) {
          return response;
        });
    }

    /**
     * @function disconnect
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description Disconnect user from service instance
     * @param {number} guid - the CNSI GUID
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function disconnect(guid) {
      var serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.disconnect(guid)
        .then(function (response) {
          onDisconnect(guid);
          return response;
        });
    }

    /* eslint-disable complexity */
    // NOTE - Complexity of 11, left in to improve readability.
    /**
     * @function list
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description Returns services instances and number registered
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function list() {
      var serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance.user');
      var cfInfoApi = apiManager.retrieve('cloud-foundry.api.Info');
      var hceInfoApi = apiManager.retrieve('cloud-foundry.api.HceInfoApi');
      var hsmApi = apiManager.retrieve('service-manager.api.HsmApi');

      return serviceInstanceApi.list().then(function (response) {
        var items = response.data;

        var hcfGuids = _.map(_.filter(items, {cnsi_type: 'hcf'}) || [], 'guid') || [];
        var hcfCfg = {headers: {'x-cnap-cnsi-list': hcfGuids.join(',')}};
        var hceGuids = _.map(_.filter(items, {cnsi_type: 'hce'}) || [], 'guid') || [];
        var hsmGuids = _.map(_.filter(items, {cnsi_type: 'hsm'}) || [], 'guid') || [];

        var tasks = [];
        // make a request on each service type to refresh the oauth token
        if (hcfGuids.length > 0) {
          tasks.push(cfInfoApi.GetInfo({}, hcfCfg).then(function (response) {
            return response.data || {};
          }));
        }
        if (hceGuids.length > 0) {
          tasks.push(hceInfoApi.info(hceGuids.join(',')));
        }
        if (hsmGuids.length > 0) {
          tasks.push(hsmApi.info(hsmGuids.join(',')));
        }

        if (tasks.length === 0) {
          onList(response);
          return serviceInstances;
        } else {
          // Swallow errors - we don't want one failure to fail everything
          return $q.all(tasks).catch(angular.noop).then(function (infoResults) {
            return serviceInstanceApi.list().then(function (listResponse) {
              onList(listResponse, infoResults);
              return serviceInstances;
            }).catch(function () {
              _.forIn(serviceInstances, function (value, key) {
                delete serviceInstances[key];
              });
              numValid = 0;
            });
          });
        }
      });

    }

    /* eslint-enable complexity */

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
    function onConnect(guid, name, response) {
      var newCnsi = response.data;
      newCnsi.guid = guid;
      newCnsi.name = name;
      newCnsi.valid = true;

      if (angular.isUndefined(serviceInstances[guid])) {
        serviceInstances[guid] = newCnsi;
      } else {
        angular.extend(serviceInstances[guid], newCnsi);
      }
    }

    /**
     * @function onDisconnect
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description onDisconnect handler
     * @param {string} guid - the CNSI GUID
     * @returns {void}
     * @private
     */
    function onDisconnect(guid) {
      if (angular.isDefined(serviceInstances[guid])) {
        delete serviceInstances[guid];
      }
    }

    function onList(response, infoResults) {
      var items = response.data;

      // check token expirations
      var now = (new Date()).getTime() / 1000;
      angular.forEach(items, function (item) {
        if (!_.isNil(item.token_expiry)) {
          item.valid = item.token_expiry > now;
        }
      });

      appUtilsService.replaceProperties(serviceInstances, _.keyBy(items, 'guid'));

      numValid = _.sumBy(items, function (o) {
        return o.valid ? 1 : 0;
      }) || 0;

      // Add in the metadata about error status of endpoints
      if (infoResults) {
        _.each(infoResults, function (data) {
          // info calls were non-passthrough - so we should have a map of guids to responses
          _.each(data, function (cnsiData, cnsiGuid) {
            // Record error status
            serviceInstances[cnsiGuid].error = !!cnsiData.error;
          });
        });
      }
    }
  }

})();
