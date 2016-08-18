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
    'app.api.apiManager',
    'cloud-foundry.model.application.stateService',
    '$q'
  ];

  function registerApplicationModel(modelManager, apiManager, appStateService, $q) {
    modelManager.register('cloud-foundry.model.application', new Application(apiManager, modelManager, appStateService, $q));
  }

  /**
   * @memberOf cloud-foundry.model.application
   * @name Application
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} appStateService - the Application State service
   * @param {object} $q - the $q service for promise/deferred objects
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.applicationApi} applicationApi - the application API proxy
   * @property {object} data - holding data.
   * @property {object} application - the currently focused application.
   * @property {string} appStateSwitchTo - the state of currently focused application is switching to.
   * @class
   */
  function Application(apiManager, modelManager, appStateService, $q) {
    this.apiManager = apiManager;
    this.modelManager = modelManager;
    this.appStateService = appStateService;
    this.applicationApi = this.apiManager.retrieve('cloud-foundry.api.Apps');
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.$q = $q;
    this.data = {
      applications: []
    };
    this.application = {
      instanceCount: 0,
      summary: {
        state: 'LOADING'
      },
      stats: {},
      pipeline: {
        fetching: false,
        valid: false,
        hceCnsi: undefined,
        hceServiceGuid: undefined
      }
    };
    this.appStateSwitchTo = '';
    this.filterParams = {
      cnsiGuid: 'all',
      orgGuid: 'all',
      spaceGuid: 'all'
    };

    // This state should be in the model
    this.clusterCount = 0;
    this.hasApps = false;

    var passThroughHeader = {
      'x-cnap-passthrough': 'true'
    };

    this.makeHttpConfig = function (cnsiGuid) {
      var headers = {'x-cnap-cnsi-list': cnsiGuid};
      angular.extend(headers, passThroughHeader);
      return {
        headers: headers
      };
    };

  }

  angular.extend(Application.prototype, {
    /**
     * @function all
     * @memberof  cloud-foundry.model.application
     * @description List all applications at the model layer
     * @param {string} guid - CNSI guid
     * @param {object} options - options for url building
     * @param {boolean} sync - whether the response should wait for all app stats or just the app metadata
     * @returns {promise} A promise object
     * @public
     **/
    all: function (guid, options, sync) {
      var that = this;

      var cnsis = [];
      if (this.filterParams.cnsiGuid === 'all') {
        cnsis = _.chain(this.serviceInstanceModel.serviceInstances)
                  .values()
                  .filter({cnsi_type: 'hcf'})
                  .map('guid')
                  .value();
      } else {
        cnsis = [this.filterParams.cnsiGuid];
      }

      options = angular.extend(options || {}, this._buildFilter());

      return this.applicationApi.ListAllApps(options, {headers: {'x-cnap-cnsi-list': cnsis.join(',')}})
        .then(function (response) {
          // For all of the apps in the running state, we may need to get stats in order to be able to
          // determine the user-friendly state of the application
          var tasks = [];
          _.each(response.data, function (appsResponse, cnsi) {
            _.each(appsResponse.resources, function (app) {
              if (app.entity.state === 'STARTED') {
                // We need more information
                tasks.push(that.returnAppStats(cnsi, app.metadata.guid, null, true).then(function (stats) {
                  app.instances = stats.data[cnsi];
                  app.instanceCount = _.keys(app.instances).length;
                  app.state = that.appStateService.get(app.entity, app.instances);
                  return stats.data[cnsi];
                }));
              } else {
                app.state = that.appStateService.get(app.entity);
              }
            });
          });
          if (!sync) {
            // Fire off the stats requests in parallel - don't wait for them to complete
            that.$q.all(tasks);
            return that.onAll(response);
          } else {
            return that.$q.all(tasks).then(function () {
              return that.onAll(response);
            });
          }
        });
    },

    /**
     * @function _buildFilter
     * @description Build filter from org or space GUID
     * @returns {object} The CF q filter
     * @private
     */
    _buildFilter: function () {
      if (this.filterParams.spaceGuid !== 'all') {
        return {q: 'space_guid:' + this.filterParams.spaceGuid};
      } else if (this.filterParams.orgGuid !== 'all') {
        return {q: 'organization_guid:' + this.filterParams.orgGuid};
      }

      return {};
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
     * @function getClusterWithId
     * @memberof cloud-foundry.model.application
     * @description get cluster with cluster ID
     * @param {string} cnsiGuid - cluster ID.
     * @returns {promise} a promise object
     * @public
     */
    getClusterWithId: function (cnsiGuid) {
      var that = this;
      return this.serviceInstanceModel.list()
        .then(function () {
          that.application.cluster = that.serviceInstanceModel.serviceInstances[cnsiGuid];
        });
    },

    /**
     * @function getAppSummary
     * @memberof cloud-foundry.model.application
     * @description get summary of an application at the model layer
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @param {boolean=} includeStats - whether to also go and fetch the application stats if the app is RUNNING
     * @returns {promise} a promise object
     * @public
     */
    getAppSummary: function (cnsiGuid, guid, includeStats) {
      var that = this;
      var config = {
        headers: {'x-cnap-cnsi-list': cnsiGuid}
      };

      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .GetAppSummary(guid, {}, config)
        .then(function (response) {
          if (!includeStats || response.data[cnsiGuid].state !== 'STARTED') {
            that.onSummary(cnsiGuid, guid, response.data[cnsiGuid]);
            return response;
          } else {
            // We were asked for stats and this app is RUNNING, so go and get them
            return that.getAppStats(cnsiGuid, guid).then(function () {
              that.onSummary(cnsiGuid, guid, response.data[cnsiGuid]);
            });
          }
        });
    },

    /**
     * @function _getAppDetails
     * @memberof cloud-foundry.model.application
     * @description get details of an application at the model layer
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @param {object} params - parameter mapping
     * @returns {promise} a promise object
     * @private
     */
    _getAppDetails: function (cnsiGuid, guid, params) {
      var that = this;
      var config = {
        headers: {'x-cnap-cnsi-list': cnsiGuid}
      };

      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .RetrieveApp(guid, params, config)
        .then(function (response) {
          that.onGetAppOrgAndSpace(response.data[cnsiGuid].entity);
        });
    },

    /**
     * @function getAppDetailsOnOrgAndSpace
     * @memberof cloud-foundry.model.application
     * @description get details of an application at the model layer
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @returns {promise} a promise object
     * @public
     */
    getAppDetailsOnOrgAndSpace: function (cnsiGuid, guid) {
      return this._getAppDetails(cnsiGuid, guid, {
        'inline-relations-depth': 2,
        'include-relations': 'organization,space'
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
        .then(that.getAppStats(cnsiGuid, guid))
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
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .CreateApp(newAppSpec, {}, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          that.getAppSummary(cnsiGuid, response.data.metadata.guid);
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
      /** Since we are targeting a single cnsi, we will enable passthrough **/
      var httpParams = {
        headers: {
          'x-cnap-passthrough': 'true'
        }
      };
      return applicationApi.UpdateApp(guid, newAppSpec, null, httpParams)
        .then(function (response) {
          if (response.data.metadata) {
            that.getAppSummary(cnsiGuid, response.data.metadata.guid);
          }
          return response.data;
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
     * @param {boolean} noCache - Do not cache fetched data
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    getAppStats: function (cnsiGuid, guid, params, noCache) {
      var that = this;
      return that.returnAppStats(cnsiGuid, guid, params, noCache).then(function (response) {
        if (!noCache) {
          var data = response.data[cnsiGuid];
          //that.application.stats = angular.isDefined(data['0']) ? data['0'].stats : {};
          // Stats for all instances
          that.application.instances = data;
          that.application.instanceCount = _.keys(data).length;
        }
        return response;
      });
    },

    /**
     * @function returnAppStats
     * @memberof cloud-foundry.model.application
     * @description Fetch application stats
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the app guid
     * @param {object} params - options for getting the stats of an app
     * @param {boolean} noCache - Do not cache fetched data
     * @returns {promise} A promise object
     * @public
     */
    returnAppStats: function (cnsiGuid, guid, params, noCache) {
      var that = this;
      var config = {
        headers: {'x-cnap-cnsi-list': cnsiGuid}
      };
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .GetDetailedStatsForStartedApp(guid, params, config)
        .then(function (response) {
          if (!noCache) {
            var data = response.data[cnsiGuid];
            that.application.stats = angular.isDefined(data['0']) ? data['0'].stats : {};
          }
          return response;
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
     * @function listHceCnsis
     * @memberof cloud-foundry.model.application
     * @description Invoke the /info endpoint of all HCE instances available to the user, in order to get their public API url.
     * The url we have registeed can be different to the API url returned by the /info endpoint.
     * @returns {promise} A promise object
     * @private
     */
    listHceCnsis: function () {
      var that = this;
      // We cache on the application - so if you add an HCE while on the app, we won't detect that
      // Saves making lots of calls
      if (this.hceServiceInfo) {
        return this.$q.when(this.hceServiceInfo);
      } else {
        var promise = this.serviceInstanceModel.serviceInstances && _.keys(this.serviceInstanceModel.serviceInstances).length
          ? this.$q.when(this.serviceInstanceModel.serviceInstances) : this.serviceInstanceModel.list();
        return promise.then(function () {
          // Retrieve dynamicllay as this model may load before the one we need
          var hceModel = that.modelManager.retrieve('cloud-foundry.model.hce');
          var hceCnsis = _.filter(that.serviceInstanceModel.serviceInstances, {cnsi_type: 'hce'}) || [];
          var hceCnsisGuids = _.chain(hceCnsis).map('guid').value();
          return hceModel.infos(hceCnsisGuids.join(',')).then(function (infos) {
            _.each(hceCnsis, function (cnsi) {
              cnsi.info = infos[cnsi.guid];
            });
            that.hceServiceInfo = hceCnsis;
            return hceCnsis;
          });
        });
      }
    },

    /**
     * @function updateDeliveryPipelineMetadata
     * @memberof cloud-foundry.model.application
     * @description Update the pipeline metadata for the application
     * @param {boolean} refresh - indicates if cached hce metadata should be refreshed
     * @returns {promise} A promise object
     * @public
     */
    updateDeliveryPipelineMetadata: function (refresh) {
      var that = this;
      var pipeline = this.application.pipeline;
      if (refresh) {
        this.hceServiceInfo = undefined;
      }
      // Retrieve dynamicllay as this model may load before the one we need
      var hcfUserProvidedServiceInstanceModel = that.modelManager.retrieve('cloud-foundry.model.user-provided-service-instance');
      // Async: work out if this application has a delivery pipeline
      // Look at the services for one named 'hce-<APP_GUID>'
      var hceServiceLink = 'hce-' + that.application.summary.guid;
      var hceServiceData = _.find(that.application.summary.services, function (svc) {
        return svc.name === hceServiceLink;
      });

      function clearDeliveryPipelineMetadata(metadata) {
        metadata.fetching = false;
        metadata.valid = false;
        metadata.hceCnsi = undefined;
        metadata.hce_api_url = undefined;
        metadata.hceServiceGuid = undefined;
      }

      if (hceServiceData) {
        // Go fetch the service metadata
        return hcfUserProvidedServiceInstanceModel.getUserProvidedServiceInstance(that.cnsiGuid, hceServiceData.guid)
        .then(function (data) {
          // Now we need to see if the CNSI is known
          if (data && data.entity && data.entity.credentials && data.entity.credentials.hce_api_url) {
            // HCE API Endpoint
            pipeline.hceServiceGuid = hceServiceData.guid;
            pipeline.hce_api_url = data.entity.credentials.hce_api_url;
            return that.listHceCnsis().then(function (hceEndpoints) {
              var hceInstance = _.find(hceEndpoints, function (hce) {
                var url = hce.info ? hce.info.api_public_uri : hce.api_endpoint.Scheme + '://' + hce.api_endpoint.Host;
                return pipeline.hce_api_url.indexOf(url) === 0;
              });
              pipeline.hceCnsi = hceInstance;
              pipeline.valid = angular.isDefined(hceInstance);
              pipeline.fetching = false;
              return pipeline;
            });
          } else {
            clearDeliveryPipelineMetadata(pipeline);
          }
        })
        .catch(function () {
          clearDeliveryPipelineMetadata(pipeline);
        });
      } else {
        clearDeliveryPipelineMetadata(pipeline);
        return that.$q.when(pipeline);
      }
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

      // Check the data we have and determine if we have any applications
      this.hasApps = false;
      if (this.clusterCount > 0 && this.data && this.data.applications) {
        var appCount = _.reduce(this.data.applications, function (sum, app) {
          if (!app.error && app.resources) {
            return sum + app.resources.length;
          } else {
            return sum;
          }
        }, 0);
        this.hasApps = appCount > 0;
      }
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
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object} response - the json return from the api call
     * @private
     */
    onSummary: function (cnsiGuid, guid, response) {
      _.set(this, 'appSummary.' + cnsiGuid + '.' + guid, response);

      /* eslint-disable no-warning-comments */
      // FIXME (TEAMFOUR-779): This is application specific and should be kept separate from a generic appSummary call
      /* eslint-enable no-warning-comments */
      this.application.summary = response;
      this.onAppStateChange();
    },

    /**
     * @function onGetAppOrgAndSpace
     * @memberof  cloud-foundry.model.application
     * @description onGetAppOrgAndSpace handler at model layer
     * @param {object} entity - response entity
     * @private
     */
    onGetAppOrgAndSpace: function (entity) {
      this.application.organization = entity.space.entity.organization.entity;
      this.application.space = entity.space.entity;
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
      this.onAppStateChange();
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
      this.onAppStateChange();
    },

    onAppStateChangeInvalid: function () {
      this.application.summary.state = 'STOPPED';
      this.appStateSwitchTo = '';
      this.onAppStateChange();
    },

    onAppStateChange: function () {
      this.application.state = this.appStateService.get(this.application.summary, this.application.instances);
    }
  });

})();
