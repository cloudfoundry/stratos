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
    'cloud-foundry.model.modelUtils',
    'app.utils.utilsService'
  ];

  function registerApplicationModel(config, modelManager, apiManager, appStateService, $q, modelUtils, utils) {
    modelManager.register('cloud-foundry.model.application', new Application(config, apiManager, modelManager,
      appStateService, $q, modelUtils, utils));
  }

  /**
   * @memberOf cloud-foundry.model.application
   * @name Application
   * @param {object} config - the global configuration object
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} appStateService - the Application State service
   * @param {object} $q - the $q service for promise/deferred objects
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @param {app.utils.utilsService} utils - the utils service
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.applicationApi} applicationApi - the application API proxy
   * @property {object} data - holding data.
   * @property {object} application - the currently focused application.
   * @property {string} appStateSwitchTo - the state of currently focused application is switching to.
   * @property {number} pageSize - page size for pagination.
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @property {app.utils.utilsService} utils - the utils service
   * @class
   */
  function Application(config, apiManager, modelManager, appStateService, $q, modelUtils, utils) {
    this.apiManager = apiManager;
    this.modelManager = modelManager;
    this.appStateService = appStateService;
    this.applicationApi = this.apiManager.retrieve('cloud-foundry.api.Apps');
    this.$q = $q;
    this.pageSize = config.pagination.pageSize;
    this.modelUtils = modelUtils;
    this.utils = utils;

    this.data = {
      applications: [],
      appStateMap: {}
    };

    this.clearApplication();
    this.appStateSwitchTo = '';
    this.filterParams = {
      cnsiGuid: 'all',
      orgGuid: 'all',
      spaceGuid: 'all'
    };

    // This state should be in the model
    this.clusterCount = 0;
    this.hasApps = false;
    // Page number (not zero based, used in UX)
    this.appPage = 1;

  }

  angular.extend(Application.prototype, {

    /**
     * @function clearApplication
     * @memberof  cloud-foundry.model.application
     * @description Clear the cached application metadata
     * @public
     **/
    clearApplication: function () {
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
        project: null,
        state: undefined
      };
    },

    /**
     * @function initApplicationFromSummary
     * @memberof  cloud-foundry.model.application
     * @param {object} appSummaryMetadata - application summary metadata
     * @public
     **/
    initApplicationFromSummary: function (appSummaryMetadata) {
      this.clearApplication();
      this.application.summary = appSummaryMetadata.entity;
      this.application.instances = appSummaryMetadata.instances || {};
      this.application.instanceCount = appSummaryMetadata.instanceCount || 0;
      this.application.state = appSummaryMetadata.state || {};

      if (this.application.instances) {
        var running = _.filter(this.application.instances, {state: 'RUNNING'});
        this.application.summary.running_instances = running.length;
      }
    },

    /**
     * @function all
     * @memberof  cloud-foundry.model.application
     * @description List all applications at the model layer
     * @param {string} guid - CNSI guid
     * @param {object} options - options for url building
     * @param {boolean} sync - whether the response should wait for all app stats or just the app metadata
     * @param {object} trim - tell how the result should be trimmed.
     * @returns {promise} A promise object
     * @public
     **/
    all: function (guid, options, sync, trim) {
      var that = this;

      options = angular.extend(options || {}, {}, this._buildFilter());

      return this.applicationApi.ListAllApps(options, this.modelUtils.makeHttpConfig(guid))
        .then(function (response) {
          var tasks = that._fetchAppStatsForApps(guid, response.data.resources);
          if (!sync) {
            // We don't need to wait for the tasks - they are already running in parallel
            return that.onAll(guid, response, trim);
          } else {
            return that.$q.all(tasks).then(function () {
              return that.onAll(guid, response, trim);
            });
          }
        });
    },

    _fetchAppStatsForApps: function (cnsiGuid, apps) {
      var that = this;
      // For all of the apps in the running state, we may need to get stats in order to be able to
      // determine the user-friendly state of the application
      var tasks = [];
      _.each(apps, function (app) {
        // Update the state for the app to give it an initial state while we wait for the API call to return
        var cacheId = app.clusterId + '#' + app.metadata.guid;
        app.state = that.data.appStateMap[cacheId] || that.appStateService.get(app.entity);

        if (app.entity.state === 'STARTED') {
          // We need more information
          tasks.push(that.returnAppStats(cnsiGuid, app.metadata.guid, null).then(function (stats) {
            app.instances = stats.data;
            app.instanceCount = _.keys(app.instances).length;
            app.state = that.appStateService.get(app.entity, app.instances);
            that.data.appStateMap[cacheId] = app.state;
            return stats.data;
          }));
        } else {
          app.state = that.appStateService.get(app.entity);
        }
      });
      return tasks;
    },

    _applyTrim: function (trim) {
      return function (apps) {
        return apps.slice(trim.start, trim.resultsPerPage - trim.end);
      };
    },

    loadPage: function (pageNumber, cachedData) {
      var that = this;
      var page = this.pagination.pages[pageNumber - 1];
      var tasks = [];

      // cached data currently always applies to page 1
      angular.forEach(page, function (clusterLoad) {
        var cnsiGuid = clusterLoad.cnsiGuid;

        angular.forEach(clusterLoad.loads, function (load) {
          if (load.resultsPerPage === 0) {
            return;
          }

          var trim = {
            start: load.trimStart,
            end: load.trimEnd,
            resultsPerPage: load.resultsPerPage
          };
          // We only support using cached data for page 1 for now
          if (pageNumber === 1 && cachedData && cachedData[cnsiGuid]) {
            tasks.push(that.$q.resolve(cachedData[cnsiGuid].resources)
            .then(that._applyTrim(trim))
            .then(function (needStats) {
              that._fetchAppStatsForApps(cnsiGuid, needStats, false);
              return needStats;
            }));
          } else {
            tasks.push(that.all(cnsiGuid, {
              page: load.number,
              'results-per-page': load.resultsPerPage
            }, false)
              .catch(angular.noop)
              .then(that._applyTrim(trim)));
          }
        });
      });

      return this.$q.all(tasks).then(function (allData) {
        that.data.applications = [];
        _.each(allData, function (apps) {
          [].push.apply(that.data.applications, apps);
        });

        that._updateAppStateMap();
        that.hasApps = that.pagination.totalPage > 0;
        that.appPage = that.hasApps ? pageNumber : 0;
      });
    },

    /**
     * @function _updateAppStateMap
     * @description Update the application state cache
     * @privatwe
     */
    _updateAppStateMap: function () {
      var that = this;
      this.data.appStateMap = {};
      _.each(this.data.applications, function (app) {
        if (app.state) {
          var cacheId = app.clusterId + '#' + app.metadata.guid;
          that.data.appStateMap[cacheId] = app.state;
        }
      });
    },

    /**
     * @function resetPagination
     * @description reset application wall pagination plan
     * @returns {object} a promise object
     * @public
     */
    resetPagination: function () {
      var that = this;
      var cnsis = this._getCurrentCnsis();

      if (!cnsis || !cnsis.length) {
        // Ensure the pagination object is initialised by running through the handler
        return this.$q.resolve(that.onGetPaginationData({ data: {}}));
      }

      // If we are making an API call to get the total number of apps,
      // the additional overhead to retrieve the metadata for those apps
      // is small in comparison to the cost of another API call to later fetch this data
      var options = angular.extend({
        'results-per-page': this.pageSize,
        page: 1
      }, this._buildFilter());

      return this.applicationApi
        .ListAllApps(options, {headers: {'x-cnap-cnsi-list': cnsis.join(',')}})
        .then(function (response) {
          return that.onGetPaginationData(response);
        })
        .catch(function (error) {
          // Clear everything
          that.data.applications.length = 0;
          that._updateAppStateMap();
          that.appPage = 0;
          that.hasApps = false;
          return that.$q.reject(error);
        });
    },

    /**
     * @function _getCurentCnsis
     * @description get a collection of CNSIs for all valid CF instances
     * @returns {Array} collection of valid CF cnsis
     * @private
     */
    _getCurrentCnsis: function () {
      var cnsis = [];
      if (this.filterParams.cnsiGuid === 'all') {
        // Ensure that we ignore any service that's invalid (cannot contact)
        cnsis = _.chain(this._getUserCnsiModel().serviceInstances)
          .values()
          .filter({cnsi_type: 'hcf', valid: true})
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
      return this.applicationApi.GetDetailedStatsForStartedApp(guid, options, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          that.onUsage(response.data);
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
      var userCnsiModel = this._getUserCnsiModel();
      var isAvailable = userCnsiModel.serviceInstances[cnsiGuid];
      var p = isAvailable ? this.$q.resolve(true) : userCnsiModel.list();
      return p.then(function () {
        that.application.cluster = userCnsiModel.serviceInstances[cnsiGuid];
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

      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .GetAppSummary(guid, {}, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!includeStats || response.data.state !== 'STARTED') {
            that.onSummary(cnsiGuid, guid, response.data);
            return response;
          } else {
            // We were asked for stats and this app is RUNNING, so go and get them
            return that.getAppStats(cnsiGuid, guid).then(function () {
              that.onSummary(cnsiGuid, guid, response.data);
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

      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .RetrieveApp(guid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          that.onGetAppOrgAndSpace(response.data.entity);
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
     * @function _getUserCnsiModel
     * @description Private method to retrieve user CNSI Model
     * @returns {*|Object}
     * @private
     */
    _getUserCnsiModel: function () {
      return this.modelManager.retrieve('app.model.serviceInstance.user');
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
        .GetEnvForApp(guid, {}, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          var data = response.data;
          if (data.error_code) {
            throw data;
          } else {
            return response.data;
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
        .RemoveServiceBindingFromApp(guid, bindingGuid, params, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    /**
     * @function listServiceBindings
     * @memberof cloud-foundry.model.application
     * @description List service bindings for application
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the application guid
     * @param {object=} params - the extra params to pass to request
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A promise object
     * @public
     **/
    listServiceBindings: function (cnsiGuid, guid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .ListAllServiceBindingsForApp(guid, this.modelUtils.makeListParams(params),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
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
        .UpdateApp(guid, {state: 'STARTED'}, {}, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(that.getAppStats(cnsiGuid, guid))
        .then(
          function (response) {
            var data = response.data;
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
        .UpdateApp(guid, {state: 'STOPPED'}, {}, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(
          function (response) {
            var data = response.data;
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
        .CreateApp(newAppSpec, {}, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          that.getAppSummary(cnsiGuid, response.data.metadata.guid);
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
      return applicationApi.UpdateApp(guid, newAppSpec, null, this.modelUtils.makeHttpConfig(cnsiGuid))
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
        .DeleteApp(guid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    /**
     * @function getAppStats
     * @memberof cloud-foundry.model.application
     * @description Returns the stats for the STARTED app
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the app guid
     * @param {object=} params - options for getting the stats of an app
     * @param {boolean=} noCache - Do not cache fetched data
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    getAppStats: function (cnsiGuid, guid, params, noCache) {
      var that = this;
      return that.returnAppStats(cnsiGuid, guid, params).then(function (response) {
        if (!noCache) {
          var data = response.data;
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
     * @returns {promise} A promise object
     * @public
     */
    returnAppStats: function (cnsiGuid, guid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .GetDetailedStatsForStartedApp(guid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
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
        .GetEnvForApp(guid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
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
      var userCnsiModel = this._getUserCnsiModel();
      if (this.hceServiceInfo) {
        return this.$q.when(this.hceServiceInfo);
      } else {
        var promise = userCnsiModel.serviceInstances && _.keys(userCnsiModel.serviceInstances).length
          ? this.$q.when(userCnsiModel.serviceInstances) : userCnsiModel.list();
        return promise.then(function () {
          // Retrieve dynamicllay as this model may load before the one we need
          var hceModel = that.modelManager.retrieve('cloud-foundry.model.hce');
          var hceCnsis = _.filter(userCnsiModel.serviceInstances, {cnsi_type: 'hce'}) || [];
          if (hceCnsis.length === 0) {
            return that.$q.when(hceCnsis);
          }
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
     * @description onGetPaginationData handler at model layer
     * @param {object} response - the response object returned from api call
     * @returns {object} list of applications
     * @private
     */
    onGetPaginationData: function (response) {
      var clusters = response.data;

      // We should in theory not reach here with error'd calls, but catch just in case
      clusters = _.pickBy(clusters, function (cluster) {
        return !cluster.error;
      });

      var totalAppNumber = 0;
      angular.forEach(clusters, function (cluster, cnsiGuid) {
        if (cluster.total_results) {
          totalAppNumber += cluster.total_results;
        }
        angular.forEach(cluster.resources, function (app) {
          app.clusterId = cnsiGuid;
        });
      });

      this.pagination = new AppPagination(clusters, this.pageSize, Math.ceil(totalAppNumber / this.pageSize), totalAppNumber);

      this.hasApps = this.pagination.totalPage > 0;
      this.appPage = this.appPage > this.pagination.pages.length ? this.pagination.pages.length : this.appPage;

      return clusters || [];
    },

    /**
     * @function onAll
     * @memberof  cloud-foundry.model.application
     * @description onAll handler at model layer
     * @param {string} guid - CNSI guid
     * @param {string} response - the json return from the api call
     * @returns {object} list of applications
     * @private
     */
    onAll: function (guid, response) {
      var apps = response.data.resources;
      angular.forEach(apps, function (app) {
        app.clusterId = guid;
      });
      return apps;
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
      this.application.organization = entity.space.entity.organization;
      this.application.space = entity.space;
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
   * @param {array} clusters - available clusters.
   * @param {number} pageSize - page size for pagination.
   * @param {number} totalPage - total number of pages.
   * @param {number} totalApps - total number of applications.
   * @property {array} clusters - available clusters.
   * @property {number} pageSize - page size for pagination.
   * @property {number} totalPage - total number of pages.
   * @property {array} pages - plan of how each page should be loaded.
   * @property {number} totalApps - total number of applications.
   * @class
   */
  function AppPagination(clusters, pageSize, totalPage, totalApps) {
    this.clusters = clusters;
    this.pageSize = pageSize;
    this.totalPage = totalPage;
    this.totalApps = totalApps;
    this.pages = [];
    this.init();
  }

  angular.extend(AppPagination.prototype, {

    /**
     * @function init
     * @memberof  AppPagination
     * @description calculate the how each page should be loaded.
     * @private
     */
    init: function () {
      var remaining, prevPage, cluster, from, to, loads, trimStart, page, cnsiGuid;
      var clusterKeys = Object.keys(this.clusters);
      var clusterIndex = 0;
      var pageSize = this.pageSize;

      for (var i = 0; i < this.totalPage; i++) {
        this.pages[i] = [];
        remaining = pageSize;
        prevPage = this.pages[i - 1];

        while (remaining && clusterIndex < clusterKeys.length) {
          cnsiGuid = clusterKeys[clusterIndex];
          cluster = this.clusters[cnsiGuid];
          from = 0;
          if (prevPage && prevPage[prevPage.length - 1].cnsiGuid === cnsiGuid) {
            from = prevPage[prevPage.length - 1].to + 1;
          }

          if (cluster.total_results > pageSize) {
            to = from + remaining - 1;
            cluster.total_results -= remaining;
            remaining = 0;

          } else if (cluster.total_results === pageSize) {
            to = from + pageSize - 1;
            remaining = 0;

            clusterIndex++;

          } else {
            to = from + Math.min(remaining, cluster.total_results) - 1;
            remaining -= to - from + 1;

            if (remaining > 0) {
              clusterIndex++;
            }
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
            page = Math.floor(from / pageSize) + 1;
            trimStart = from % pageSize;

            if (trimStart === 0) {
              loads = [{
                number: page,
                resultsPerPage: pageSize,
                trimStart: 0,
                trimEnd: 0
              }];

            } else {
              loads = [{
                number: page,
                resultsPerPage: pageSize,
                trimStart: trimStart,
                trimEnd: 0
              }, {
                number: page + 1,
                resultsPerPage: pageSize,
                trimStart: 0,
                trimEnd: pageSize - trimStart
              }];
            }
          }

          this.pages[i].push({
            cluster: cluster,
            cnsiGuid: cnsiGuid,
            from: from,
            to: to,
            loads: loads
          });
        } // end of while
      } // end of for
    }
  });

})();
