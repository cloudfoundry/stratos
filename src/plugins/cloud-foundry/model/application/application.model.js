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
    'app.config',
    'app.model.modelManager',
    'app.api.apiManager',
    'cloud-foundry.model.application.stateService',
    '$q',
    'app.utils.utilsService'
  ];

  function registerApplicationModel(config, modelManager, apiManager, appStateService, $q, utils) {
    modelManager.register('cloud-foundry.model.application', new Application(config, apiManager, modelManager, appStateService, $q, utils));
  }

  /**
   * @memberOf cloud-foundry.model.application
   * @name Application
   * @param {object} config - the global configuration object
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} appStateService - the Application State service
   * @param {object} $q - the $q service for promise/deferred objects
   * @param {app.utils.utilsService} utils - the utils service
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.applicationApi} applicationApi - the application API proxy
   * @property {object} data - holding data.
   * @property {object} application - the currently focused application.
   * @property {string} appStateSwitchTo - the state of currently focused application is switching to.
   * @property {app.utils.utilsService} utils - the utils service
   * @property {number} pageSize - page size for pagination.
   * @class
   */
  function Application(config, apiManager, modelManager, appStateService, $q, utils) {
    this.apiManager = apiManager;
    this.modelManager = modelManager;
    this.appStateService = appStateService;
    this.applicationApi = this.apiManager.retrieve('cloud-foundry.api.Apps');
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.$q = $q;
    this.utils = utils;
    this.pageSize = config.pagination.pageSize;
    this.tempApplications = []; // used to collecting applications on app wall

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
        hceServiceGuid: undefined,
        projectId: undefined
      },
      project: null
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
    all: function (guid, options, sync, trim) {
      var that = this;
      var cnsis = [guid];

      options = angular.extend(options || {}, {
      }, this._buildFilter());

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
            return that.onAll(guid, response, trim);
          } else {
            return that.$q.all(tasks).then(function () {
              return that.onAll(guid, response, trim);
            });
          }
        });
    },

    loadPage: function (pageNumber) {
      this.tempApplications.length = 0;

      var that = this;
      var page = this.pagination.pages[pageNumber - 1];
      var clusterLoad;
      var funcs = [];
      var load;

      for (var i = 0; i < page.length; i++) {
        clusterLoad = page[i];
        var clusterId = clusterLoad.clusterId;
        for (var j = 0; j < clusterLoad.loads.length; j++) {
          load = clusterLoad.loads[j];
          funcs.push(function () {

            console.log(load);

            return that.all(clusterId, {
              page: load.number,
              'results-per-page': load.resultsPerPage
            }, false, {
              start: load.trimStart,
              end: load.trimEnd
            });
          });
        }
      }

      var p = this.utils.runInSequence(funcs, true);

      p.then(function () {
        that.data.applications = that.tempApplications;
      });
      return p;
    },

    /**
     * @function resetPagination
     * @description reset application wall pagination plan
     * @returns {object} The CF q filter
     * @public
     */
    resetPagination: function () {
      var that = this;
      var cnsis = this._getCurrentCnsis();
      var options = angular.extend({
        'results-per-page': 1,
        page: 1
      }, this._buildFilter());

      this.data.applications.length = 0;

      return this.applicationApi
        .ListAllApps(options, {headers: {'x-cnap-cnsi-list': cnsis.join(',')}})
        .then(function (response) {
          return that.onGetPaginationData(response);
        });
    },

    /**
     * @function _getCurentCnsis
     * @description get currently filtered service instances
     * @returns {object} The CF q filter
     * @private
     */
    _getCurrentCnsis: function () {
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
      return cnsis;
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
     * @function unbindServiceFromApp
     * @memberof cloud-foundry.model.application
     * @description Unbind service instance from application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @param {string} bindingGuid - the service binding id
     * @param {object} params - optional params
     * @returns {promise} a promise object
     * @public
     */
    unbindServiceFromApp: function (cnsiGuid, guid, bindingGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .RemoveServiceBindingFromApp(guid, bindingGuid, params, this.makeHttpConfig(cnsiGuid));
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
        .DeleteApp(guid, null, this.makeHttpConfig(cnsiGuid));
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
        metadata.projectId = undefined;
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
              pipeline.projectId = _.toNumber(data.entity.credentials.hce_pipeline_id);
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
     * @function onGetPaginationData
     * @memberof  cloud-foundry.model.application
     * @description  onGetPaginationData handler at model layer
     * @param {object} response - the response object returned from api call
     * @private
     */
    onGetPaginationData: function (response) {
      var clusters = response.data;
      var totalAppNumber = 0;

      angular.forEach(clusters, function (cluster) {
        if (cluster.total_results) {
          totalAppNumber += cluster.total_results;
        }
      });

      console.log('TOTAL Application # %d', totalAppNumber);
      this.pagination = new AppPagination(clusters, this.pageSize, Math.ceil(totalAppNumber / this.pageSize));
    },

    /**
     * @function onAll
     * @memberof  cloud-foundry.model.application
     * @description onAll handler at model layer
     * @param {string} guid - CNSI guid
     * @param {string} response - the json return from the api call
     * @private
     */
    onAll: function (guid, response, trim) {
      var apps = response.data[guid].resources;
      apps = apps.slice(trim.start, apps.length - trim.end);
      angular.forEach(apps, function (app) {
        app.clusterId = guid;
      });
      [].push.apply(this.tempApplications, apps);
      this.hasApps = this.pagination.totalPage > 0;
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

  /**
   * @memberOf cloud-foundry.model.application
   * @name AppPagination
   * @property {array} clusters - avialable clusters.
   * @property {number} pageSize - page size for pagination.
   * @property {number} totalPage - total number of pages.
   * @property {array} pages - plan of how each page should be loaded.
   * @class
   */
  function AppPagination (clusters, pageSize, totalPage) {
    this.clusters = clusters;
    this.pageSize = pageSize;
    this.totalPage = totalPage;
    this.pages = [];
    this.init();

    console.log(this.pages);
  }

  angular.extend(AppPagination.prototype, {

    /**
     * @function init
     * @memberof  AppPagination
     * @description calculate the how each page should be loaded.
     * @private
     */
    init: function () {
      var remaining, prevPage, cluster, from, to, resultsPerPage, loads, trimStart, page;
      var clusterKeys = Object.keys(this.clusters);
      var clusterIndex = 0;
      var pageSize = this.pageSize;

      for (var i = 0; i < this.totalPage; i++) {
        this.pages[i] = [];

        remaining = pageSize;
        prevPage = this.pages[i - 1];

        while (remaining && clusterIndex < clusterKeys.length) {
          cluster = this.clusters[clusterKeys[clusterIndex]];

          from = 0;
          if (prevPage && prevPage[prevPage.length - 1].clusterId === clusterKeys[clusterIndex]) {
            from = prevPage[prevPage.length - 1].to + 1;
          }

          if (cluster.total_results > pageSize) {
            to = from + pageSize - 1;
            remaining = 0;
            cluster.total_results -= pageSize;

          } else if (cluster.total_results === pageSize) {
            to = from + pageSize - 1;
            remaining = 0;
            clusterIndex++;

          } else {
            to = from + cluster.total_results - 1;
            remaining -= cluster.total_results;
            clusterIndex++;
          }

          if (from === 0) {
            loads = [{
              number: 1,
              resultsPerPage: to + 1,
              trimStart: 0,
              trimEnd: 0
            }];

          } else if (from + 1 < pageSize) {
            loads = [{
              number: 1,
              resultsPerPage: from + pageSize,
              trimStart: from,
              trimEnd: 0
            }];

          } else {
            resultsPerPage = pageSize;
            page = Math.floor(from / resultsPerPage) + 1;
            trimStart = from % resultsPerPage;

            if (trimStart === 0) {
              loads = [{
                number: page,
                resultsPerPage: resultsPerPage,
                trimStart: 0,
                trimEnd: 0
              }];

            } else {
              loads = [{
                number: page,
                resultsPerPage: 19,
                trimStart: trimStart,
                trimEnd: 0
              }, {
                number: page + 1,
                resultsPerPage: resultsPerPage,
                trimStart: 0,
                trimEnd: resultsPerPage - trimStart
              }];
            }
          }

          this.pages[i].push({
            cluster: cluster,
            clusterId: clusterKeys[clusterIndex],
            from: from,
            to: to,
            loads: loads
          });
        }
      }
    }
  });

})();
