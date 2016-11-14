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
    this.loadingLimit = config.loadingLimit;
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
    // Track the list of apps fetched from the back end. List may or may not be filtered.
    this.bufferedApplications = [];
    // Track the list of apps from the last time we fetched. Used to ensure we have something to show if filters change
    // whilst bufferedApplications is empty while loading.
    this.cachedApplications = [];
    // Track the list of apps filtered by local means
    this.filteredApplications = [];
    // The unfiltered application count. Normally this is fetched by default in a ListAllApps request, however sometimes
    // this is filtered by org or space
    this.unfilteredApplicationCount = undefined;
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

    _fetchAppStatsForApps: function (apps) {
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
          tasks.push(that.returnAppStats(app.clusterId, app.metadata.guid, null).then(function (stats) {
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

    /**
     * @function loadPage
     * @description make applications data set ready for the current displaying page
     * @param {number} pageNumber The display page number
     * @returns {object} promise object
     * @public
     */
    loadPage: function (pageNumber) {
      var start = (pageNumber - 1) * this.pageSize;
      var end = start + this.pageSize;
      this.data.applications = _.slice(this.filteredApplications, start, end);
      this.appPage = pageNumber;
      this._updateAppStateMap();
      this._fetchAppStatsForApps(this.data.applications);

      return this.$q.resolve();
    },

    /**
     * @function _updateAppStateMap
     * @description Update the application state cache
     * @private
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
     * @returns {object} promise object
     * @public
     */
    resetPagination: function () {
      return this._listAllApps();
    },

    /**
     * @function _listAllApps
     * @description list all applications
     * @returns {object} promise object
     * @private
     */
    _listAllApps: function () {
      var that = this;
      this.bufferedApplications = [];

      return this._listAllAppsWithPage(1, that.loadingLimit, that._getCurrentCnsis())
        .then(_.bind(this._onListAllAppsSuccess, this))
        .then(function () {
          if (_.isMatch(that.filterParams, {orgGuid: 'all', spaceGuid: 'all'})) {
            // No org/space filter applied, the app count can be found in the cached applications
            that.unfilteredApplicationCount = that.cachedApplications.length;
          } else {
            // Filter applied. Reach out and call again without filters and only retrieve a single app per cnsi.

            // This will run every time the user changes the org or space filters. Tested with 1001 apps and it takes
            // about 60ms to complete (HCF in AWS)
            that.applicationApi.ListAllApps({
              'results-per-page': 1
            }, {
              headers: {
                'x-cnap-cnsi-list': that._getCurrentCnsis().join(',')
              }
            }).then(function (response) {
              that.unfilteredApplicationCount = _.sum(_.map(response.data, 'total_results'));
            });
          }
        })
        .then(function () {
          if (that.filterParams.cnsiGuid !== 'all') {
            that.filterByCluster(that.filterParams.cnsiGuid);
          }
        })
        .catch(_.bind(this._onListAllAppsFailure, this));
    },

    /**
     * @function _onListAllAppsSuccess
     * @description success handler for listAllApps promise.
     * @private
     */
    _onListAllAppsSuccess: function () {
      this.hasApps = this.bufferedApplications.length > 0;
      this._sortApps();
      this._updateCache();
      this.resetFilter();
    },

    /**
     * @function _updateCache
     * @description update cached application list.
     * @private
     */
    _updateCache: function () {
      this.cachedApplications = _.clone(this.bufferedApplications);
    },

    /**
     * @function _sortApps
     * @description sort all applications by name.
     * @private
     */
    _sortApps: function () {
      this._injectSortingKey(this.bufferedApplications);
      this.bufferedApplications = _.orderBy(this.bufferedApplications, ['__sortingKey__'], ['asc']);
      this._removeSortingKey(this.bufferedApplications);
    },

    /**
     * @function _injectSortingKey
     * @description inject a temporary sorting key for sorting.
     * @param {Array} apps A list applications.
     * @private
     */
    _injectSortingKey: function (apps) {
      _.each(apps, function (app) {
        app.__sortingKey__ = _.get(app, 'entity.name', '_').toLowerCase();
      });
    },

    /**
     * @function _removeSortingKey
     * @description remove the temporary sorting key.
     * @param {Array} apps A list applications.
     * @private
     */
    _removeSortingKey: function (apps) {
      _.each(apps, function (app) {
        delete app.__sortingKey__;
      });
    },

    /**
     * @function _onListAllAppsFailure
     * @description failure handler for listAllApps promise.
     * @param {*} error An error.
     * @returns {object} promise object
     * @private
     */
    _onListAllAppsFailure: function (error) {
      this._updateAppStateMap();
      this._reset();
      return this.$q.reject(error);
    },

    /**
     * @function _listAllAppsWithPageHelper
     * @description helper to call the list apps API with the correct params and options
     * @param {number} page The loading page number against API. This is not the displaying page number.
     * @param {number} pageSize The loading page size against API. This is not the displaying page side number.
     * @param {Array} cnsis An array of cluster IDs to load applications.
     * @returns {object} promise object
     * @private
     */
    _listAllAppsWithPageHelper: function (page, pageSize, cnsis) {
      var that = this;
      var options = angular.extend({
        'results-per-page': pageSize,
        page: page
      }, this._buildFilter());
      var config = {
        headers: {
          'x-cnap-cnsi-list': cnsis.join(',')
        }
      };
      return this.applicationApi.ListAllApps(options, config).then(function (response) {
        that._onListAllAppsWithPageSuccess(response.data);
        return response;
      });
    },

    /**
     * @function _listAllAppsWithPage
     * @description list apps with given loading page number and limitation.
     * @param {number} page The loading page number against API. This is not the displaying page number.
     * @param {number} pageSize The loading page size against API. This is not the displaying page side number.
     * @param {Array} cnsis An array of cluster IDs to load applications.
     * @returns {object} promise object
     * @private
     */
    _listAllAppsWithPage: function (page, pageSize, cnsis) {
      var that = this;
      if (cnsis.length === 0) {
        return that.$q.resolve();
      }

      return this._listAllAppsWithPageHelper(page, pageSize, cnsis)
        .then(function (response) {
          if (!response.data) {
            return that.$q.reject();
          } else {
            // We can further optimize the calls to be in parallel - after the first call, we know how many calls we need to make
            // Find the highest total number of page
            var maxPage = _.max(_.map(response.data, function (hcfResponse) {
              return hcfResponse.total_pages || 0;
            }));
            var tasks = [];
            for (var i = 2; i <= maxPage; i++) {
              var cnsis = that._getClustersWithPage(response.data, i);
              tasks.push(that._listAllAppsWithPageHelper(i, pageSize, cnsis));
            }
            return that.$q.all(tasks);
          }
        });
    },

    /**
     * @function _onListAllAppsWithPageSuccess
     * @description success handler for _listAllAppsWithPage promise.
     * @param {object} data The data set in map data structure that holds data of applications for each cluster.
     * @private
     */
    _onListAllAppsWithPageSuccess: function (data) {
      this._accumulateApps(data);
    },

    /**
     * @function _accumulateApps
     * @description accumulate sub data set to build up the whole buffered application list.
     * @param {object} data The data set in map data structure that holds data of applications for each cluster.
     * @private
     */
    _accumulateApps: function (data) {
      var that = this;
      _.each(data, function (value, key) {
        var apps = value.resources;
        if (!apps) {
          return;
        }
        _.each(apps, function (app) {
          app.clusterId = key;
        });
        that.bufferedApplications = that.bufferedApplications.concat(apps);
      });
    },

    /**
     * @function _getClustersWithPage
     * @description get the cluster IDs that still have applications to load.
     * @param {object} data The data set in map data structure that holds data of applications for each cluster.
     * @param {number} page The page that is to be requested
     * @returns {Array} An array of clusters still need to retrieve applications from that have the specified page
     * @private
     */
    _getClustersWithPage: function (data, page) {
      var cnsis = [];
      _.each(data, function (value, key) {
        if (value.total_pages >= page) {
          cnsis.push(key);
        }
      });
      return cnsis;
    },

    /**
     * @function _reset
     * @description reset the model state
     * @private
     */
    _reset: function () {
      this.data.applications.length = 0;
      this.hasApps = false;
      this.appPage = 0;
    },

    /**
     * @function _getCurentCnsis
     * @description get a collection of CNSIs for all valid CF instances
     * @returns {Array} collection of valid CF cnsis
     * @private
     */
    _getCurrentCnsis: function () {
      // Find cnsi's to reach out to
      // - Ignore cnsi's that are invalid (session expired) or errored (cannot contact)
      // - Fetch apps from all available cnsi's. Specifically important if we return to the page and pre-filter. Need
      // to ignore this in order to have the correct cache
      return _.chain(this._getUserCnsiModel().serviceInstances)
          .values()
          .filter({cnsi_type: 'hcf', valid: true, error: false})
          .map('guid')
          .value();
    },

    /**
     * @function filterByCluster
     * @description filter applications by cluster ID.
     * @param {string} clusterId The cluster ID to filter by.
     * @public
     */
    filterByCluster: function (clusterId) {
      var apps = _.clone(this.cachedApplications);
      this.filteredApplications = _.filter(apps, ['clusterId', clusterId]);
      this.hasApps = this.filteredApplications.length > 0;
    },

    /**
     * @function resetFilter
     * @description clean out applied filtering and reset the applications back;
     * @public
     */
    resetFilter: function () {
      this.filteredApplications = _.clone(this.cachedApplications);
      this.hasApps = this.filteredApplications.length > 0;
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
          response.data.clusterId = cnsiGuid;
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
            that.getAppSummary(cnsiGuid, response.data.metadata.guid, true);
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
     * @function terminateRunningAppInstanceAtGivenIndex
     * @memberof cloud-foundry.model.application
     * @description Terminate an application instance
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - Application identifier
     * @param {string} index - Instance index
     * @returns {promise}
     * @public
     */
    terminateRunningAppInstanceAtGivenIndex: function (cnsiGuid, guid, index) {
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .TerminateRunningAppInstanceAtGivenIndex(guid, index, {}, this.modelUtils.makeHttpConfig(cnsiGuid));
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
      var cacheId = this.application.summary.clusterId + '#' + this.application.summary.guid;
      this.data.appStateMap[cacheId] = this.application.state;
    }
  });

})();
