(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.application
   * @memberOf cloud-foundry.model
   * @name application
   * @description Application model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerApplicationModel);

  registerApplicationModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerApplicationModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.application', new Application(apiManager, modelManager));
  }

  /**
   * @memberof cloud-foundry.model.application
   * @name Application
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.applicationApi} applicationApi - the application API proxy
   * @property {object} data - holding data.
   * @property {object} application - the currently focused application.
   * @property {string} appStateSwitchTo - the state of currently focused application is switching to.
   * @class
   */
  function Application(apiManager, modelManager) {
    this.apiManager = apiManager;
    this.modelManager = modelManager;
    this.applicationApi = this.apiManager.retrieve('cloud-foundry.api.Apps');
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.data = {};
    this.application = {
      summary: {
        state: 'LOADING'
      },
      stats: {}
    };
    this.appStateSwitchTo = '';
  }

  angular.extend(Application.prototype, {
    /**
     * @function all
     * @memberof  cloud-foundry.model.application
     * @description List all applications at the model layer
     * @param {string} guid - application guid
     * @param {object} options - options for url building
     * @returns {promise} A promise object
     * @public
     **/
    all: function (guid, options) {
      var that = this;
      var cnsis = _.chain(this.serviceInstanceModel.serviceInstances)
                   .values()
                   .map('guid')
                   .value();
      return this.applicationApi.ListAllApps(options, {headers: { 'x-cnap-cnsi-list': cnsis.join(',')}})
        .then(function (response) {
          that.onAll(response);
        });
    },

    /**
     * @function usage
     * @memberof cloud-foundry.model.application
     * @description List the usage at the model layer
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - application guid
     * @param {object} options - options for url building
     * @returns {promise} A promise object
     * @public
     **/
    usage: function (cnsiGuid, guid, options) {
      var that = this;
      return this.applicationApi.GetDetailedStatsForStartedApp(guid, options)
        .then(function (response) {
          that.onUsage(response.data[cnsiGuid]);
        });
    },

    /**
     * @function files
     * @memberof  cloud-foundry.model.application
     * @description List the files at the model layer
     * @param {string} guid - application guid
     * @param {string} instanceIndex - the instanceIndex
     * @param {string} filepath - the filePath
     * @param {object} options - options for url building
     * @returns {promise} A promise object
     * @public
     **/
    files: function (guid, instanceIndex, filepath, options) {
      var that = this;
      return this.applicationApi.files(guid, instanceIndex, filepath, options)
        .then(function (response) {
          that.onFiles(response);
        });
    },

    /**
     * @function getAppSummary
     * @memberof cloud-foundry.model.application
     * @description get summary of an application at the model layer
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @returns {promise} a promise object
     * @public
     */
    getAppSummary: function (cnsiGuid, guid) {
      var that = this;
      var config = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .GetAppSummary(guid, {}, config)
        .then(function (response) {
          that.onSummary(response.data[cnsiGuid]);
        });
    },

    /**
     * @function getAppVariables
     * @memberof cloud-foundry.model.application
     * @description get variables of an application at the model layer
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @returns {promise} a promise object
     * @public
     **/
    getAppVariables: function (cnsiGuid, guid) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .GetEnvForApp(guid)
        .then(function (response) {
          var data = response.data[cnsiGuid];
          if (data.error_code) {
            throw data;
          } else {
            return response.data[cnsiGuid];
          }
        })
        .then(function (data) {
          that.application.variables = data;
        });
    },

    /**
     * @function listServiceBindings
     * @memberof cloud-foundry.model.application
     * @description List service bindings for application
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the application guid
     * @param {object} params - the extra params to pass to request
     * @returns {promise} A promise object
     * @public
     **/
    listServiceBindings: function (cnsiGuid, guid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .ListAllServiceBindingsForApp(guid, params)
        .then(function (response) {
          return response.data[cnsiGuid].resources;
        });
    },

    /**
     * @function startApp
     * @memberof cloud-foundry.model.application
     * @description start an application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @returns {promise} a promise object
     * @public
     */
    startApp: function (cnsiGuid, guid) {
      var that = this;
      this.appStateSwitchTo = 'STARTED';
      this.application.summary.state = 'PENDING';
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .UpdateApp(guid, {state: 'STARTED'})
        .then(
          function (response) {
            var data = response.data[cnsiGuid];
            if (angular.isDefined(data.entity)) {
              that.onAppStateChangeSuccess(data);
            } else if (data.error_code === 'CF-AppPackageInvalid') {
              that.onAppStateChangeInvalid();
            } else {
              that.onAppStateChangeFailure();
            }
            return response;
          },
          function (error) {
            that.onAppStateChangeFailure();
            return error;
          }
        );
    },

    /**
     * @function stopApp
     * @memberof cloud-foundry.model.application
     * @description stop an application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @returns {promise} a promise object
     * @public
     */
    stopApp: function (cnsiGuid, guid) {
      var that = this;
      this.appStateSwitchTo = 'STOPPED';
      this.application.summary.state = 'PENDING';
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .UpdateApp(guid, {state: 'STOPPED'})
        .then(
          function (response) {
            var data = response.data[cnsiGuid];
            if (angular.isDefined(data.entity)) {
              that.onAppStateChangeSuccess(data);
            } else {
              that.onAppStateChangeFailure();
            }
            return response;
          },
          function (error) {
            that.onAppStateChangeFailure();
            return error;
          }
        );
    },

    /**
     * @function restartApp
     * @memberof cloud-foundry.model.application
     * @description restart an application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @public
     */
    restartApp: function (cnsiGuid, guid) {
      var that = this;
      this.stopApp(cnsiGuid, guid).then(function () {
        that.startApp(cnsiGuid, guid);
      });
    },

    /**
     * @function createApp
     * @memberof cloud-foundry.model.application
     * @description Create an application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object} newAppSpec - values for the new Application
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    createApp: function (cnsiGuid, newAppSpec) {
      var that = this;
      var config = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .CreateApp(newAppSpec, {}, config)
        .then(function (response) {
          that.getAppSummary(cnsiGuid, response.data[cnsiGuid].metadata.guid);
          that.all();
          return response.data;
        });
    },

    /**
     * @function update
     * @memberof cloud-foundry.model.application
     * @description Update an application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application guid
     * @param {object} newAppSpec - values to update Application
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    update: function (cnsiGuid, guid, newAppSpec) {
      var that = this;
      var applicationApi = this.apiManager.retrieve('cloud-foundry.api.Apps');
      return applicationApi.UpdateApp(guid, newAppSpec)
        .then(function (response) {
          if (response.data[cnsiGuid].metadata) {
            that.getAppSummary(cnsiGuid, response.data[cnsiGuid].metadata.guid);
          }
          return response.data[cnsiGuid];
        });
    },

    /**
     * @function deleteApp
     * @memberof cloud-foundry.model.application
     * @description Detete an application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - Application identifier
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    deleteApp: function (cnsiGuid, guid) {
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .DeleteApp(guid);
    },

    /**
     * @function getAppStats
     * @memberof cloud-foundry.model.application
     * @description Returns the stats for the STARTED app
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the app guid
     * @param {object} params - options for getting the stats of an app
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    getAppStats: function (cnsiGuid, guid, params) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .GetDetailedStatsForStartedApp(guid, params)
        .then(function (response) {
          var data = response.data[cnsiGuid];
          that.application.stats = angular.isDefined(data['0']) ? data['0'].stats : {};
        });
    },

    /**
     * @function getEnv
     * @memberof cloud-foundry.model.application
     * @description Get env variables for application
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the application guid
     * @param {object} params - the extra params to pass to request
     * @returns {promise} A promise object
     * @public
     */
    getEnv: function (cnsiGuid, guid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .GetEnvForApp(guid, params)
        .then(function (response) {
          return response.data[cnsiGuid];
        });
    },

    /**
     * @function onAll
     * @memberof  cloud-foundry.model.application
     * @description onAll handler at model layer
     * @param {string} response - the json return from the api call
     * @private
     */
    onAll: function (response) {
      this.data.applications = response.data;
    },

    /**
     * @function onUsage
     * @memberof  cloud-foundry.model.application
     * @description onUsage handler at model layer
     * @param {string} response - the return from the api call
     * @private
     */
    onUsage: function (response) {
      this.data.usage = response;
    },

    /**
     * @function onFiles
     * @memberof  cloud-foundry.model.application
     * @description onFiles handler at model layer
     * @param {string} response - the return from the api call
     * @private
     */
    onFiles: function (response) {
      this.data.files = response.data;
    },

    /**
     * @function onSummary
     * @memberof  cloud-foundry.model.application
     * @description onSummary handler at model layer
     * @param {object} response - the json return from the api call
     * @private
     */
    onSummary: function (response) {
      this.application.summary = response;
    },

    /**
     * @function onAppStateChangeSuccess
     * @memberof  cloud-foundry.model.application
     * @description onAppStateChangeSuccess handler at model layer
     * @param {object} response - the json return from the api call
     * @private
     */
    onAppStateChangeSuccess: function (response) {
      this.application.summary.state = response.entity.state;
      this.appStateSwitchTo = '';
    },

    /**
     * @function onAppStateChangeFailure
     * @memberof  cloud-foundry.model.application
     * @description onAppStateChangeFailure handler at model layer
     * @private
     */
    onAppStateChangeFailure: function () {
      this.application.summary.state = 'ERROR';
      this.appStateSwitchTo = '';
    },

    onAppStateChangeInvalid: function () {
      this.application.summary.state = 'STOPPED';
      this.appStateSwitchTo = '';
    }
  });

})();
