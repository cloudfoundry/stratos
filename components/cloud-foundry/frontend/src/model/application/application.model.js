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
    .constant('appConfig', {
      pagination: {
        pageSize: 48
      },
      loadingLimit: 100
    })
    .run(registerApplicationModel);

  function registerApplicationModel(appConfig, modelManager, apiManager, cfAppStateService, $q, modelUtils, appLocalStorage) {
    modelManager.register('cloud-foundry.model.application', new Application(appConfig, apiManager, modelManager,
      cfAppStateService, $q, modelUtils, appLocalStorage));
  }

  /**
   * @memberOf cloud-foundry.model.application
   * @name Application
   * @param {appConfig} config - the global configuration object
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} cfAppStateService - the Application State service
   * @param {object} $q - the $q service for promise/deferred objects
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @param {appLocalStorage} appLocalStorage - service provides access to the local storage facility of the web browser
   * @property {object} data - holding data.
   * @property {object} application - the currently focused application.
   * @property {string} appStateSwitchTo - the state of currently focused application is switching to.
   * @property {number} pageSize - page size for pagination.
   * @class
   */
  function Application(config, apiManager, modelManager, cfAppStateService, $q, modelUtils, appLocalStorage) {
    var applicationApi = apiManager.retrieve('cloud-foundry.api.Apps');
    var loadingLimit = config.loadingLimit;

    // Track the list of apps fetched from the back end. List may or may not be filtered.
    var bufferedApplications = [];

    var model = {
      data: {
        applications: [],
        appStateMap: {}
      },
      pageSize: config.pagination.pageSize,
      filterParams: angular.fromJson(appLocalStorage.getItem('cf.filterParams')) || {
        cnsiGuid: 'all',
        orgGuid: 'all',
        spaceGuid: 'all'
      },
      // Controls view of App Wall (Card layout or List layout)
      // Try and get this from Browser local storage, if not, default to card layout
      showCardLayout: appLocalStorage.getItem('cf.app.cardLayout', 'true') === 'true',
      // This state should be in the model
      clusterCount: 0,
      hasApps: false,
      // Track the list of apps from the last time we fetched. Used to ensure we have something to show if filters change
      // whilst bufferedApplications is empty while loading.
      cachedApplications: [],
      // Track the list of apps filtered by local means
      filteredApplications: [],
      // The unfiltered application count. Normally this is fetched by default in a ListAllApps request, however sometimes
      // this is filtered by org or space
      unfilteredApplicationCount: undefined,
      // Page number (not zero based, used in UX)
      appPage: 1,
      // Sorting options
      // Default to sorting with the newest applications first
      currentSortOption: 'metadata.created_at',
      sortAscending: false,
      clearApplication: clearApplication,
      initApplicationFromSummary: initApplicationFromSummary,
      reSort: reSort,
      loadPage: loadPage,
      resetPagination: resetPagination,
      filterByCluster: filterByCluster,
      filterByText: filterByText,
      resetFilter: resetFilter,
      usage: usage,
      files: files,
      getClusterWithId: getClusterWithId,
      getAppSummary: getAppSummary,
      getAppDetailsOnOrgAndSpace: getAppDetailsOnOrgAndSpace,
      getAppVariables: getAppVariables,
      unbindServiceFromApp: unbindServiceFromApp,
      listServiceBindings: listServiceBindings,
      startApp: startApp,
      stopApp: stopApp,
      restartApp: restartApp,
      createApp: createApp,
      update: update,
      deleteApp: deleteApp,
      terminateRunningAppInstanceAtGivenIndex: terminateRunningAppInstanceAtGivenIndex,
      getAppStats: getAppStats,
      returnAppStats: returnAppStats,
      getEnv: getEnv,
      onAppStateChange: onAppStateChange
    };

    clearApplication();

    return model;

    /**
     * @function clearApplication
     * @memberof  cloud-foundry.model.application
     * @description Clear the cached application metadata
     * @public
     **/
    function clearApplication() {
      model.application = {
        instanceCount: 0,
        summary: {
          state: 'LOADING'
        },
        stats: {},
        pipeline: {
          fetching: false,
          valid: false,
          forbidden: false,
          projectId: undefined
        },
        project: null,
        state: undefined
      };
    }

    /**
     * @function initApplicationFromSummary
     * @memberof  cloud-foundry.model.application
     * @param {object} appSummaryMetadata - application summary metadata
     * @public
     **/
    function initApplicationFromSummary(appSummaryMetadata) {
      clearApplication();
      model.application.summary = appSummaryMetadata.entity;
      model.application.instances = appSummaryMetadata.instances || {};
      model.application.instanceCount = appSummaryMetadata.instanceCount || 0;
      model.application.state = appSummaryMetadata.state || {};

      if (model.application.instances) {
        var running = _.filter(model.application.instances, {state: 'RUNNING'});
        model.application.summary.running_instances = running.length;
      }
    }

    function _fetchAppStatsForApps(apps) {

      // For all of the apps in the running state, we may need to get stats in order to be able to
      // determine the user-friendly state of the application
      var tasks = [];
      _.each(apps, function (app) {
        // Update the state for the app to give it an initial state while we wait for the API call to return
        var cacheId = app.clusterId + '#' + app.metadata.guid;
        app.state = model.data.appStateMap[cacheId] || cfAppStateService.get(app.entity);

        if (app.entity.state === 'STARTED') {
          // We need more information
          tasks.push(returnAppStats(app.clusterId, app.metadata.guid, null).then(function (stats) {
            app.instances = stats.data;
            app.instanceCount = _.keys(app.instances).length;
            app.state = cfAppStateService.get(app.entity, app.instances);
            model.data.appStateMap[cacheId] = app.state;
            return stats.data;
          }));
        } else {
          app.state = cfAppStateService.get(app.entity);
        }
      });
      return tasks;
    }

    /**
     * @function reloadPage
     * @description reload the current page of applications, re-applying the sort order
     * @returns {object} promise object
     * @public
     */
    function reSort() {
      _sortFilteredApplications();
      return loadPage(model.appPage);
    }

    /**
     * @function loadPage
     * @description make applications data set ready for the current displaying page
     * @param {number} pageNumber The display page number
     * @returns {object} promise object
     * @public
     */
    function loadPage(pageNumber) {
      var start = (pageNumber - 1) * model.pageSize;
      var end = start + model.pageSize;
      model.data.applications = _.slice(model.filteredApplications, start, end);
      model.appPage = pageNumber;
      _updateAppStateMap();
      _fetchAppStatsForApps(model.data.applications);

      return $q.resolve();
    }

    /**
     * @function _updateAppStateMap
     * @description Update the application state cache
     * @private
     */
    function _updateAppStateMap() {

      model.data.appStateMap = {};
      _.each(model.data.applications, function (app) {
        if (app.state) {
          var cacheId = app.clusterId + '#' + app.metadata.guid;
          model.data.appStateMap[cacheId] = app.state;
        }
      });
    }

    /**
     * @function resetPagination
     * @description reset application wall pagination plan
     * @param {boolean=} fromCache - reset apps + pagination using cached applications instead of reaching out to portal
     * @returns {object} promise object
     * @public
     */
    function resetPagination(fromCache) {
      return _listAllApps(fromCache);
    }

    /**
     * @function _listAllApps
     * @description list all applications
     * @param {boolean=} fromCache - reset apps + pagination using cached applications instead of reaching out to portal
     * @returns {object} promise object
     * @private
     */
    function _listAllApps(fromCache) {

      var loadPromise;
      if (fromCache) {
        loadPromise = $q.resolve();
      } else {
        bufferedApplications = [];
        loadPromise = _listAllAppsWithPage(1, loadingLimit, _getCurrentCnsis());
      }
      return loadPromise
        .then(_.bind(_onListAllAppsSuccess, this, true))
        .then(function () {
          if (_.isMatch(model.filterParams, {orgGuid: 'all', spaceGuid: 'all'})) {
            // No org/space filter applied, the app count can be found in the cached applications
            model.unfilteredApplicationCount = model.cachedApplications.length;
          } else {
            // Filter applied. Reach out and call again without filters and only retrieve a single app per cnsi.

            // This will run every time the user changes the org or space filters. Tested with 1001 apps and it takes
            // about 60ms to complete (CF in AWS)
            applicationApi.ListAllApps({
              'results-per-page': 1
            }, {
              headers: {
                'x-cap-cnsi-list': _getCurrentCnsis().join(',')
              }
            }).then(function (response) {
              model.unfilteredApplicationCount = _.sum(_.map(response.data, 'total_results'));
            });
          }
        })
        .then(function () {
          var didFilter = false;
          if (model.filterParams.cnsiGuid !== 'all') {
            filterByCluster(model.filterParams.cnsiGuid);
            didFilter = true;
          }
          if (model.filterParams.text) {
            filterByText(model.filterParams.text);
            didFilter = true;
          }
          if (!didFilter) {
            resetFilter();
          }
        })
        .catch(_.bind(_onListAllAppsFailure, this));
    }

    /**
     * @name sortFilteredApplications
     * @description Sort model.filteredApplications based on the required sort parameters
     *
     */
    function _sortFilteredApplications() {
      var path = model.currentSortOption;
      var sortOrder = model.sortAscending ? 'asc' : 'desc';
      model.filteredApplications = _.orderBy(model.filteredApplications, function (app) {
        var value = _.get(app, path);
        if (_.isString(value)) {
          return value.toLowerCase();
        }
        return value;
      }, sortOrder);
    }

    /**
     * @function _onListAllAppsSuccess
     * @description success handler for listAllApps promise.
     * @param {boolean} skipReset do not reset the filter
     * @private
     */
    function _onListAllAppsSuccess(skipReset) {
      model.hasApps = bufferedApplications.length > 0;
      _updateCache();
      if (!skipReset) {
        resetFilter();
      }
    }

    /**
     * @function _updateCache
     * @description update cached application list.
     * @private
     */
    function _updateCache() {
      model.cachedApplications = _.clone(bufferedApplications);
    }

    /**
     * @function _onListAllAppsFailure
     * @description failure handler for listAllApps promise.
     * @param {*} error An error.
     * @returns {object} promise object
     * @private
     */
    function _onListAllAppsFailure(error) {
      _updateAppStateMap();
      _reset();
      return $q.reject(error);
    }

    /**
     * @function _listAllAppsWithPageHelper
     * @description helper to call the list apps API with the correct params and options
     * @param {number} page The loading page number against API. This is not the displaying page number.
     * @param {number} pageSize The loading page size against API. This is not the displaying page side number.
     * @param {Array} cnsis An array of cluster IDs to load applications.
     * @returns {object} promise object
     * @private
     */
    function _listAllAppsWithPageHelper(page, pageSize, cnsis) {

      var options = angular.extend({
        'results-per-page': pageSize,
        page: page
      }, _buildFilter());
      var config = {
        headers: {
          'x-cap-cnsi-list': cnsis.join(',')
        }
      };
      return applicationApi.ListAllApps(options, config).then(function (response) {
        _onListAllAppsWithPageSuccess(response.data);
        return response;
      });
    }

    /**
     * @function _listAllAppsWithPage
     * @description list apps with given loading page number and limitation.
     * @param {number} page The loading page number against API. This is not the displaying page number.
     * @param {number} pageSize The loading page size against API. This is not the displaying page side number.
     * @param {Array} cnsis An array of cluster IDs to load applications.
     * @returns {object} promise object - contains array containing ALL applications
     * @private
     */
    function _listAllAppsWithPage(page, pageSize, cnsis) {

      if (cnsis.length === 0) {
        return $q.resolve();
      }

      return _listAllAppsWithPageHelper(page, pageSize, cnsis)
        .then(function (response) {
          if (!response.data) {
            return $q.reject();
          } else {
            // We can further optimize the calls to be in parallel - after the first call, we know how many calls we need to make
            // Find the highest total number of page
            var maxPage = _.max(_.map(response.data, function (cfResponse) {
              return cfResponse.total_pages || 0;
            }));
            var tasks = [];
            for (var i = 2; i <= maxPage; i++) {
              var cnsis = _getClustersWithPage(response.data, i);
              tasks.push(_listAllAppsWithPageHelper(i, pageSize, cnsis));
            }
            return $q.all(tasks);
          }
        });
    }

    /**
     * @function _onListAllAppsWithPageSuccess
     * @description success handler for _listAllAppsWithPage promise.
     * @param {object} data The data set in map data structure that holds data of applications for each cluster.
     * @private
     */
    function _onListAllAppsWithPageSuccess(data) {
      _accumulateApps(data);
    }

    /**
     * @function _accumulateApps
     * @description accumulate sub data set to build up the whole buffered application list.
     * @param {object} data The data set in map data structure that holds data of applications for each cluster.
     * @private
     */
    function _accumulateApps(data) {

      _.each(data, function (value, key) {
        var apps = value.resources;
        if (!apps) {
          return;
        }
        _.each(apps, function (app) {
          app.clusterId = key;
        });
        bufferedApplications = bufferedApplications.concat(apps);
      });
    }

    /**
     * @function _getClustersWithPage
     * @description get the cluster IDs that still have applications to load.
     * @param {object} data The data set in map data structure that holds data of applications for each cluster.
     * @param {number} page The page that is to be requested
     * @returns {Array} An array of clusters still need to retrieve applications from that have the specified page
     * @private
     */
    function _getClustersWithPage(data, page) {
      var cnsis = [];
      _.each(data, function (value, key) {
        if (value.total_pages >= page) {
          cnsis.push(key);
        }
      });
      return cnsis;
    }

    /**
     * @function _reset
     * @description reset the model state
     * @private
     */
    function _reset() {
      model.data.applications.length = 0;
      model.hasApps = false;
      model.appPage = 0;
    }

    /**
     * @function _getCurentCnsis
     * @description get a collection of CNSIs for all valid CF instances
     * @returns {Array} collection of valid CF cnsis
     * @private
     */
    function _getCurrentCnsis() {
      // Find cnsi's to reach out to
      // - Ignore cnsi's that are invalid (session expired) or errored (cannot contact)
      // - Fetch apps from all available cnsi's. Specifically important if we return to the page and pre-filter. Need
      // to ignore this in order to have the correct cache
      return _.chain(_getUserCnsiModel().serviceInstances)
        .values()
        .filter({cnsi_type: 'cf', valid: true, error: false})
        .map('guid')
        .value();
    }

    /**
     * @function filterByCluster
     * @description filter applications by cluster ID.
     * @param {string} clusterId The cluster ID to filter by.
     * @public
     */
    function filterByCluster(clusterId) {
      model.filteredApplications = _.filter(model.cachedApplications, ['clusterId', clusterId]);
      _sortFilteredApplications();
      model.hasApps = model.filteredApplications.length > 0;
    }

    function filterByText(text) {
      text = text.toLowerCase();
      model.filteredApplications = _.filter(model.cachedApplications, function (app) {
        if (app.entity.name.toLowerCase().indexOf(text) > -1) {
          return app;
        }
      });
      _sortFilteredApplications();
      model.hasApps = model.filteredApplications.length > 0;
    }

    /**
     * @function resetFilter
     * @description clean out applied filtering and reset the applications back;
     * @public
     */
    function resetFilter() {
      model.filteredApplications = _.clone(model.cachedApplications);
      _sortFilteredApplications();
      model.hasApps = model.filteredApplications.length > 0;
    }

    /**
     * @function _buildFilter
     * @description Build filter from org or space GUID
     * @returns {object} The CF q filter
     * @private
     */
    function _buildFilter() {
      if (model.filterParams.spaceGuid !== 'all') {
        return {q: 'space_guid:' + model.filterParams.spaceGuid};
      } else if (model.filterParams.orgGuid !== 'all') {
        return {q: 'organization_guid:' + model.filterParams.orgGuid};
      }

      return {};
    }

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
    function usage(cnsiGuid, guid, options) {

      return applicationApi.GetDetailedStatsForStartedApp(guid, options, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          onUsage(response.data);
        });
    }

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
    function files(guid, instanceIndex, filepath, options) {

      return applicationApi.files(guid, instanceIndex, filepath, options)
        .then(function (response) {
          onFiles(response);
        });
    }

    /**
     * @function getClusterWithId
     * @memberof cloud-foundry.model.application
     * @description get cluster with cluster ID
     * @param {string} cnsiGuid - cluster ID.
     * @returns {promise} a promise object
     * @public
     */
    function getClusterWithId(cnsiGuid) {

      var userCnsiModel = _getUserCnsiModel();
      var isAvailable = userCnsiModel.serviceInstances[cnsiGuid];
      var p = isAvailable ? $q.resolve(true) : userCnsiModel.list();
      return p.then(function () {
        model.application.cluster = userCnsiModel.serviceInstances[cnsiGuid];
      });
    }

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
    function getAppSummary(cnsiGuid, guid, includeStats) {
      return apiManager.retrieve('cloud-foundry.api.Apps')
        .GetAppSummary(guid, {}, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          response.data.clusterId = cnsiGuid;
          if (!includeStats || response.data.state !== 'STARTED') {
            onSummary(cnsiGuid, guid, response.data);
            return response;
          } else {
            // We were asked for stats and this app is RUNNING, so go and get them
            return getAppStats(cnsiGuid, guid).then(function () {
              onSummary(cnsiGuid, guid, response.data);
            });
          }
        });
    }

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
    function _getAppDetails(cnsiGuid, guid, params) {
      return apiManager.retrieve('cloud-foundry.api.Apps')
        .RetrieveApp(guid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          onGetAppOrgAndSpace(response.data);
        });
    }

    /**
     * @function getAppDetailsOnOrgAndSpace
     * @memberof cloud-foundry.model.application
     * @description get details of an application at the model layer
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @returns {promise} a promise object
     * @public
     */
    function getAppDetailsOnOrgAndSpace(cnsiGuid, guid) {
      return _getAppDetails(cnsiGuid, guid, {
        'inline-relations-depth': 2,
        'include-relations': 'organization,space'
      });
    }

    /**
     * @function _getUserCnsiModel
     * @description Private method to retrieve user CNSI Model
     * @returns {*|Object}
     * @private
     */
    function _getUserCnsiModel() {
      return modelManager.retrieve('app.model.serviceInstance.user');
    }

    /**
     * @function getAppVariables
     * @memberof cloud-foundry.model.application
     * @description get variables of an application at the model layer
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @returns {promise} a promise object
     * @public
     **/
    function getAppVariables(cnsiGuid, guid) {

      return apiManager.retrieve('cloud-foundry.api.Apps')
        .GetEnvForApp(guid, {}, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          var data = response.data;
          if (data.error_code) {
            throw data;
          } else {
            return response.data;
          }
        })
        .then(function (data) {
          model.application.variables = data;
        });
    }

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
    function unbindServiceFromApp(cnsiGuid, guid, bindingGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Apps')
        .RemoveServiceBindingFromApp(guid, bindingGuid, params, modelUtils.makeHttpConfig(cnsiGuid));
    }

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
    function listServiceBindings(cnsiGuid, guid, params, paginate) {
      return apiManager.retrieve('cloud-foundry.api.Apps')
        .ListAllServiceBindingsForApp(guid, modelUtils.makeListParams(params),
          modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }

    /**
     * @function startApp
     * @memberof cloud-foundry.model.application
     * @description start an application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @returns {promise} a promise object
     * @public
     */
    function startApp(cnsiGuid, guid) {

      model.appStateSwitchTo = 'STARTED';
      model.application.summary.state = 'PENDING';
      return apiManager.retrieve('cloud-foundry.api.Apps')
        .UpdateApp(guid, {state: 'STARTED'}, {}, modelUtils.makeHttpConfig(cnsiGuid))
        .then(getAppStats(cnsiGuid, guid))
        .then(
          function (response) {
            var data = response.data;
            if (angular.isDefined(data.entity)) {
              onAppStateChangeSuccess(data);
            } else if (data.error_code === 'CF-AppPackageInvalid') {
              onAppStateChangeInvalid();
            } else {
              onAppStateChangeFailure();
            }
            return response;
          },
          function (error) {
            onAppStateChangeFailure();
            return error;
          }
        );
    }

    /**
     * @function stopApp
     * @memberof cloud-foundry.model.application
     * @description stop an application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @returns {promise} a promise object
     * @public
     */
    function stopApp(cnsiGuid, guid) {

      model.appStateSwitchTo = 'STOPPED';
      model.application.summary.state = 'PENDING';
      return apiManager.retrieve('cloud-foundry.api.Apps')
        .UpdateApp(guid, {state: 'STOPPED'}, {}, modelUtils.makeHttpConfig(cnsiGuid))
        .then(
          function (response) {
            var data = response.data;
            if (angular.isDefined(data.entity)) {
              onAppStateChangeSuccess(data);
            } else {
              onAppStateChangeFailure();
            }
            return response;
          },
          function (error) {
            onAppStateChangeFailure();
            return error;
          }
        );
    }

    /**
     * @function restartApp
     * @memberof cloud-foundry.model.application
     * @description restart an application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - the application id
     * @public
     */
    function restartApp(cnsiGuid, guid) {

      stopApp(cnsiGuid, guid).then(function () {
        startApp(cnsiGuid, guid);
      });
    }

    /**
     * @function createApp
     * @memberof cloud-foundry.model.application
     * @description Create an application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object} newAppSpec - values for the new Application
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function createApp(cnsiGuid, newAppSpec) {

      return apiManager.retrieve('cloud-foundry.api.Apps')
        .CreateApp(newAppSpec, {}, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          getAppSummary(cnsiGuid, response.data.metadata.guid);
          return response.data;
        });
    }

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
    function update(cnsiGuid, guid, newAppSpec) {

      var applicationApi = apiManager.retrieve('cloud-foundry.api.Apps');
      return applicationApi.UpdateApp(guid, newAppSpec, null, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (response.data.metadata) {
            getAppSummary(cnsiGuid, response.data.metadata.guid, true);
          }
          return response.data;
        });
    }

    /**
     * @function deleteApp
     * @memberof cloud-foundry.model.application
     * @description Detete an application
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - Application identifier
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function deleteApp(cnsiGuid, guid) {
      return apiManager.retrieve('cloud-foundry.api.Apps')
        .DeleteApp(guid, null, modelUtils.makeHttpConfig(cnsiGuid));
    }

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
    function terminateRunningAppInstanceAtGivenIndex(cnsiGuid, guid, index) {
      return apiManager.retrieve('cloud-foundry.api.Apps')
        .TerminateRunningAppInstanceAtGivenIndex(guid, index, {}, modelUtils.makeHttpConfig(cnsiGuid));
    }

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
    function getAppStats(cnsiGuid, guid, params, noCache) {

      return returnAppStats(cnsiGuid, guid, params).then(function (response) {
        if (!noCache) {
          var data = response.data;
          // Stats for all instances
          model.application.instances = data;
          model.application.instanceCount = _.keys(data).length;
        }
        return response;
      });
    }

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
    function returnAppStats(cnsiGuid, guid, params) {
      return apiManager.retrieve('cloud-foundry.api.Apps')
        .GetDetailedStatsForStartedApp(guid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response;
        });
    }

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
    function getEnv(cnsiGuid, guid, params) {
      return apiManager.retrieve('cloud-foundry.api.Apps')
        .GetEnvForApp(guid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }

    /**
     * @function onUsage
     * @memberof  cloud-foundry.model.application
     * @description onUsage handler at model layer
     * @param {string} response - the return from the api call
     * @private
     */
    function onUsage(response) {
      model.data.usage = response;
    }

    /**
     * @function onFiles
     * @memberof  cloud-foundry.model.application
     * @description onFiles handler at model layer
     * @param {string} response - the return from the api call
     * @private
     */
    function onFiles(response) {
      model.data.files = response.data;
    }

    /**
     * @function onSummary
     * @memberof  cloud-foundry.model.application
     * @description onSummary handler at model layer
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object} response - the json return from the api call
     * @private
     */
    function onSummary(cnsiGuid, guid, response) {
      _.set(model, 'appSummary.' + cnsiGuid + '.' + guid, response);

      /* eslint-disable no-warning-comments */
      // FIXME (TEAMFOUR-779): This is application specific and should be kept separate from a generic appSummary call
      /* eslint-enable no-warning-comments */
      model.application.summary = response;
      onAppStateChange();
    }

    /**
     * @function onGetAppOrgAndSpace
     * @memberof  cloud-foundry.model.application
     * @description onGetAppOrgAndSpace handler at model layer
     * @param {object} application - response
     * @private
     */
    function onGetAppOrgAndSpace(application) {
      model.application.organization = application.entity.space.entity.organization;
      model.application.space = application.entity.space;
      model.application.metadata = application.metadata;
    }

    /**
     * @function onAppStateChangeSuccess
     * @memberof  cloud-foundry.model.application
     * @description onAppStateChangeSuccess handler at model layer
     * @param {object} response - the json return from the api call
     * @private
     */
    function onAppStateChangeSuccess(response) {
      model.application.summary.state = response.entity.state;
      model.appStateSwitchTo = '';
      onAppStateChange();
    }

    /**
     * @function onAppStateChangeFailure
     * @memberof  cloud-foundry.model.application
     * @description onAppStateChangeFailure handler at model layer
     * @private
     */
    function onAppStateChangeFailure() {
      model.application.summary.state = 'ERROR';
      model.appStateSwitchTo = '';
      onAppStateChange();
    }

    function onAppStateChangeInvalid() {
      model.application.summary.state = 'STOPPED';
      model.appStateSwitchTo = '';
      onAppStateChange();
    }

    function onAppStateChange() {
      model.application.state = cfAppStateService.get(model.application.summary, model.application.instances);
      var cacheId = model.application.summary.clusterId + '#' + model.application.summary.guid;
      model.data.appStateMap[cacheId] = model.application.state;
    }
  }

})();
