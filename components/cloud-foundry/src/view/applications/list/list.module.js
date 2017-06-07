(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list', [
      'cloud-foundry.view.applications.list.gallery-view'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.list', {
      url: '/list',
      templateUrl: 'plugins/cloud-foundry/view/applications/list/list.html',
      controller: ApplicationsListController,
      controllerAs: 'applicationsListCtrl'
    });
  }

  /**
   * @name ApplicationsListController
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {object} $translate - the angular $translate service
   * @param {object} $state - the UI router $state service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $q - the angular $q promise service
   * @param {object} $window - the angular $window service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {appEventService} appEventService - the event bus service
   * @param {appErrorService} appErrorService - the error service
   * @param {object} appUtilsService - the appUtilsService service
   * @param {app.framework.widgets.frameworkDetailView} frameworkDetailView - The console's frameworkDetailView service
   * @param {object} cfOrganizationModel - the cfOrganizationModel service
   * @property {object} $translate - the angular $translate service
   * @property {object} $state - the UI router $state service
   * @property {object} $timeout - the angular $timeout service
   * @property {app.model.modelManager} modelManager - the Model management service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {appEventService} appEventService - the event bus service
   * @property {appErrorService} errorService - the error service
   */
  function ApplicationsListController($scope, $translate, $state, $timeout, $q, $window, modelManager,
                                      appEventService, appErrorService, appUtilsService, frameworkDetailView,
                                      cfOrganizationModel) {
    var that = this;
    this.$translate = $translate;
    this.$state = $state;
    this.$timeout = $timeout;
    this.$q = $q;
    this.modelManager = modelManager;
    this.frameworkDetailView = frameworkDetailView;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.appEventService = appEventService;
    this.errorService = appErrorService;
    this.loading = true;
    this.isSpaceDeveloper = false;
    this.clusters = [{label: 'All Endpoints', value: 'all'}];
    this.organizations = [{label: 'All Organizations', value: 'all'}];
    this.spaces = [{label: 'All Spaces', value: 'all'}];
    this.isEndpointsDashboardAvailable = appUtilsService.isPluginAvailable('endpointsDashboard');
    this.filter = {
      cnsiGuid: 'all',
      orgGuid: 'all',
      spaceGuid: 'all'
    };
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.cfOrganizationModel = cfOrganizationModel;

    this.paginationProperties = {
      callback: function (page) {
        return that._loadPage(page);
      },
      total: _.ceil(that.model.cachedApplications.length / that.model.pageSize),
      pageNumber: _.get(that.model, 'appPage', 1),
      text: {
        nextBtn: 'buttons.next',
        prevBtn: 'buttons.previous'
      }
    };

    // Width at which we automatically switch to the grid layout
    var FORCE_GRID_LAYOUT_WIDTH = 640;

    // If we have previous apps show the stale values from cache. This avoids showing a blank screen for
    // the majority of use cases where nothing has changed.
    this.ready = this.model.hasApps;

    // Force card layout on smaller screen sizes - listen for resize events
    this.forceCardLayout = $window.innerWidth <= FORCE_GRID_LAYOUT_WIDTH;
    var previousLayout = false;
    function onResize() {
      var shouldForceCardLayout = $window.innerWidth <= FORCE_GRID_LAYOUT_WIDTH;
      if (shouldForceCardLayout !== that.forceCardLayout) {
        that.forceCardLayout = shouldForceCardLayout;
        $scope.$apply(function () {
          if (that.forceCardLayout) {
            previousLayout = that.model.showCardLayout;
            that.goToGalleryView(true);
          } else {
            that.goToGalleryView(previousLayout);
          }
        });
      }
    }
    angular.element($window).on('resize', onResize);

    function init() {
      var serviceInstances = _.values(that.userCnsiModel.serviceInstances);
      for (var i = 0; i < serviceInstances.length; i++) {
        var cluster = serviceInstances[i];
        if (that.authModel.doesUserHaveRole(cluster.guid, that.authModel.roles.space_developer)) {
          that.isSpaceDeveloper = true;
          break;
        }
      }

      return $q.resolve()
        .then(function () {
          that.filter.text = that.model.filterParams.text;
        })
        .then(_.bind(that._setClusters, that))
        .then(_.bind(that._setOrgs, that))
        .then(_.bind(that._setSpaces, that))
        .then(_.bind(that._reload, that, true))
        .finally(function () {
          // Ensure ready is always set after initial load. Ready will show filters, no services/app message, etc
          that.ready = true;
        });
    }

    appUtilsService.chainStateResolve('cf.applications.list', $state, init);

    // Ensure any app errors we have set are cleared when the scope is destroyed
    $scope.$on('$destroy', function () {
      that.errorService.clearAppError();
      // Ensure that remove the resize handler on the window
      angular.element($window).off('resize', onResize);
    });
  }

  angular.extend(ApplicationsListController.prototype, {

    /**
     * @function getNoAppsMessage
     * @description Get the message to display when there are no apps
     * @returns {string} No Apps message that is contextualised to the current filter
     * @public
     */
    getNoAppsMessage: function () {
      var text = 'app-wall.no-apps.default';
      if (this.model.filterParams.cnsiGuid !== 'all') {
        if (this.model.filterParams.orgGuid !== 'all') {
          if (this.model.filterParams.spaceGuid !== 'all') {
            text = 'app-wall.no-apps.empty-space';
          } else {
            text = 'app-wall.no-apps.empty-org';
          }
        } else {
          text = 'app-wall.no-apps.empty-endpoint';
        }
      }
      text = this.$translate.instant(text);
      return this.model.filterParams.text && this.model.filterParams.text.length
        ? this.$translate.instant('app-wall.no-apps.empty-x-due-to-search', { emptyXMessage: text })
        : text;
    },

    getEndpointsLink: function () {
      if (this.model.clusterCount === 0 && this.isEndpointsDashboardAvailable) {
        return this.$state.go('endpoint.dashboard');
      }
      var cfs = _.filter(this.userCnsiModel.serviceInstances, {cnsi_type: 'cf'});
      if (cfs.length === 1) {
        return this.$state.go('endpoint.clusters.cluster.detail.organizations', {guid: cfs[0].guid});
      }
      return this.$state.go('endpoint.clusters.tiles');
    },

    /**
     * @function _setClusters
     * @description Set the cluster filter list
     * @returns {promise}
     * @private
     */
    _setClusters: function () {
      // get the list of connected CF endpoints
      this.clusters.length = 1;
      var clusters = _.chain(this.userCnsiModel.serviceInstances)
        .values()
        .filter({cnsi_type: 'cf'})
        .map(function (o) {
          return {label: o.name, value: o.guid};
        })
        .value();
      [].push.apply(this.clusters, clusters);
      this.model.clusterCount = clusters.length;

      // Reset filtered cluster if it's no longer valid
      if (!_.find(this.clusters, { value: this.model.filterParams.cnsiGuid})) {
        this.model.filterParams.cnsiGuid = 'all';
      }

      // Check to see if the set of clusters has changed
      var clusterGuids = _.map(clusters, 'value');
      if (this.model.filterLastCluster) {
        var intersection = _.intersection(this.model.filterLastCluster, clusterGuids);
        if (this.model.filterLastCluster.length !== intersection.length || clusterGuids.length !== intersection.length) {
          // Set of GUIDs has changed, so reset the all filters. This avoids confusion for users when they add a new cf
          // and don't see any new apps due to a pre-existing filter.
          this.model.filterParams.cnsiGuid = 'all';
          this.model.filterParams.orgGuid = 'all';
          this.model.filterParams.spaceGuid = 'all';
          // Also up front reset local filter values
          this.filter.cnsiGuid = this.model.filterParams.cnsiGuid;
          this.filter.orgGuid = this.model.filterParams.orgGuid;
          this.filter.spaceGuid = this.model.filterParams.spaceGuid;
        }
      }

      // Select the previous filter value or first cluster in list
      if (this.model.filterParams.cnsiGuid !== 'all') {
        this.filter.cnsiGuid = this.model.filterParams.cnsiGuid;
      } else if (this.model.clusterCount === 1) {
        this.model.filterParams.cnsiGuid = clusters[0].value;
        this.filter.cnsiGuid = this.model.filterParams.cnsiGuid;
      }

      this.model.filterLastCluster = clusterGuids;

      return this.$q.resolve();
    },

    /**
     * @function _setOrgs
     * @description Set the org filter list
     * @returns {promise} A promise
     * @private
     */
    _setOrgs: function () {
      var that = this;
      this.organizations.length = 1;
      if (this.model.filterParams.cnsiGuid !== 'all') {
        return this.cfOrganizationModel.listAllOrganizations(this.model.filterParams.cnsiGuid)
          .then(function (newOrgs) {
            var orgs = _.map(newOrgs, that._selectMapping);
            [].push.apply(that.organizations, orgs);

            // Reset filtered organization if it's no longer valid
            if (!_.find(that.organizations, { value: that.model.filterParams.orgGuid})) {
              that.model.filterParams.orgGuid = 'all';
            }

            // Select the previous filter value or first organization in list
            if (that.model.filterParams.orgGuid !== 'all') {
              that.filter.orgGuid = that.model.filterParams.orgGuid;
            } else if (orgs.length === 1) {
              that.model.filterParams.orgGuid = orgs[0].value;
              that.filter.orgGuid = that.model.filterParams.orgGuid;
            }
          });
      } else {
        return this.$q.resolve();
      }
    },

    /**
     * @function _setSpaces
     * @description Set the space filter list
     * @returns {promise} A promise
     * @private
     */
    _setSpaces: function () {
      var that = this;
      this.spaces.length = 1;
      if (this.model.filterParams.cnsiGuid !== 'all' &&
        this.model.filterParams.orgGuid !== 'all') {
        return this.cfOrganizationModel.listAllSpacesForOrganization(
          this.model.filterParams.cnsiGuid,
          this.model.filterParams.orgGuid
        )
          .then(function (newSpaces) {
            var spaces = _.map(newSpaces, that._selectMapping);
            [].push.apply(that.spaces, spaces);

            // Reset filtered space if it's no longer valid
            if (!_.find(that.spaces, { value: that.model.filterParams.spaceGuid})) {
              that.model.filterParams.spaceGuid = 'all';
            }

            // Select the previous filter value or first space in list
            if (that.model.filterParams.spaceGuid !== 'all') {
              that.filter.spaceGuid = that.model.filterParams.spaceGuid;
            } else if (spaces.length === 1) {
              that.model.filterParams.spaceGuid = spaces[0].value;
              that.filter.spaceGuid = that.model.filterParams.spaceGuid;
            }
          });
      } else {
        return this.$q.resolve();
      }
    },

    /**
     * @function _setFilter
     * @description Set filter in application model and this module
     * @param {object} updatedFilter - the updated filter
     * @returns {void}
     * @private
     */
    _setFilter: function (updatedFilter) {
      angular.extend(this.model.filterParams, updatedFilter);
      angular.extend(this.filter, updatedFilter);
    },

    /**
     * @function _loadPage
     * @description Retrieve apps with given page number
     * @param {number} page - page number
     * @returns {promise} A promise
     * @private
     */
    _loadPage: function (page) {
      var that = this;
      this.loading = true;

      return this.model.loadPage(page)
        .finally(function () {
          that.loading = false;
          that._handleErrors();
        });
    },

    /**
     * @function _reload
     * @description Reload the application wall
     * @param {boolean=} retainPage Attempt to retain the current page after pagination has reloaded
     * @param {boolean=} fromCache Reset pagination (and apps) from cache instead of service
     * @returns {promise} A promise
     * @private
     */
    _reload: function (retainPage, fromCache) {
      var that = this;
      var reloadPage = retainPage ? that.model.appPage : 1;
      this.loading = true;

      return this.model.resetPagination(fromCache)
        .then(function () {
          that.paginationProperties.total = _.ceil(that.model.filteredApplications.length / that.model.pageSize);

          //Ensure page number is valid and load it
          reloadPage = reloadPage < 1 ? 1 : reloadPage;
          reloadPage = reloadPage > that.paginationProperties.total ? that.paginationProperties.total : reloadPage;
          if (reloadPage) {
            that._loadPage(reloadPage).then(function () {
              that.paginationProperties.pageNumber = reloadPage;
            });
          }
        })
        .catch(function (error) {
          that.paginationProperties.total = 0;
          that.paginationProperties.pageNumber = 0;
          return that.$q.reject(error);
        })
        .finally(function () {
          that.loading = false;
        });
    },

    /**
     * @function _handleErrors
     * @description Check the user's service instance data to see if any services returned an error
     * @returns {void}
     * @orivate
     */
    _handleErrors: function () {
      var that = this;
      var errors = [];
      var servicesWithErrors = _.filter(this.userCnsiModel.serviceInstances, {cnsi_type: 'cf', error: true});
      _.each(servicesWithErrors, function (cnsi) {
        if (that.filter.cnsiGuid === cnsi.guid || that.filter.cnsiGuid === 'all') {
          errors.push(cnsi.name);
        }
      });
      if (errors.length === 1) {
        that.errorService.setAppError(that.$translate.instant('app-wall.errors.single-endpoint-down', {name: errors[0]}));
      } else if (errors.length > 1) {
        that.errorService.setAppError('app-wall.errors.multiple-endpoint-down');
      } else {
        that.errorService.clearAppError();
      }
    },

    /**
     * @function getClusterOrganizations
     * @description Get organizations for selected cluster
     * @returns {void}
     * @public
     */
    setCluster: function () {
      var that = this;
      this.organizations.length = 1;
      this.model.filterParams.cnsiGuid = this.filter.cnsiGuid;
      // Reload if we're coming FROM a situation where we won't have all apps (previously filtered by org/space)
      var needToReload = !_.isMatch(this.filter, {orgGuid: 'all', spaceGuid: 'all'});
      this._setFilter({orgGuid: 'all', spaceGuid: 'all'});
      this.$q.resolve()
        .then(_.bind(this._setOrgs, this))
        .then(_.bind(this._setSpaces, this))
        .then(function () {
          // Reload if we're going TO a situation where we won't have all apps (filtered by org/space). _setOrg may have
          // changed the org and space filter
          needToReload = needToReload || !_.isMatch(that.filter, {orgGuid: 'all', spaceGuid: 'all'});

          if (needToReload) {
            that._reload();
          } else {
            if (that.filter.cnsiGuid === 'all') {
              that.model.resetFilter();
            } else {
              that.model.filterByCluster(that.filter.cnsiGuid);
            }
            that.paginationProperties.pageNumber = 1;
            that.paginationProperties.total = _.ceil(that.model.filteredApplications.length / that.model.pageSize);
            that._loadPage(1);
          }
        });
    },

    /**
     * @function getOrganizationSpaces
     * @description Get spaces for selected organization
     * @returns {void}
     * @public
     */
    setOrganization: function () {
      var that = this;
      this.spaces.length = 1;
      this.model.filterParams.orgGuid = this.filter.orgGuid;
      this._setFilter({spaceGuid: 'all'});
      this._setSpaces().then(function () {
        that._reload();
      });
    },

    setSpace: function () {
      this.model.filterParams.spaceGuid = this.filter.spaceGuid;
      this._reload();
    },

    setText: function () {
      this.model.filterParams.text = this.filter.text;
      this._reload(true, true);
    },

    toggleFilterPanel: function () {
      this.model.hideFilterPanel = !this.model.hideFilterPanel;
    },

    /**
     * @function resetFilter
     * @description Reset the filter to all
     * @returns {void}
     * @public
     */
    resetFilter: function () {
      var that = this;
      var clusters = this.clusters;

      this.clusters = [];
      this.$timeout(function () {
        that.clusters = clusters;
        that._setFilter({cnsiGuid: 'all', text: ''});
        that.setCluster();
      }, 100);
    },

    /**
     * @function _selectMapping
     * @description Select mapping for select input options
     * @param {object} obj - the object to get mapping for
     * @returns {object} Select input option mapping
     * @private
     */
    _selectMapping: function (obj) {
      return {
        label: obj.entity.name,
        value: obj.metadata.guid
      };
    },

    /**
     * @function isAdminInAnyCf
     * @description Helper to detect if user is an admin in any connected CF
     * @returns {boolean} true if the user is connected to any CF as an admin
     */
    isAdminInAnyCf: function () {
      for (var guid in this.userCnsiModel.serviceInstances) {
        if (!this.userCnsiModel.serviceInstances.hasOwnProperty(guid)) {
          continue;
        }
        if (this.userCnsiModel.serviceInstances[guid].cnsi_type !== 'cf') {
          continue;
        }
        if (this.authModel.isAdmin(guid)) {
          return true;
        }
      }
    },

    /**
     * @function showAddApplicationButton
     * @description Implements the logic for showing the `Add Application` button
     * @returns {boolean} true if the user is an admin or a Space developer to any CF
     */
    showAddApplicationButton: function () {
      if (this.isAdminInAnyCf()) {
        return true;
      }
      return !this.disableAddApplicationButton();
    },

    /**
     * @function addApplication
     * @description Shows the Add Application dialog
     */
    addApplication: function () {
      this.frameworkDetailView(
        {
          templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/add-app-dialog.html',
          dialog: true,
          class: 'dialog-form-large'
        }
      );
    },

    /**
     * @function disableAddApplicationButton
     * @description Implements the logic for disabling the `Add Application` button
     * @returns {boolean} true is App module is initialising,
     * there no connected endpoints or user is not a space developer
     */
    disableAddApplicationButton: function () {
      return !this.ready || this.model.clusterCount <= 0 || !this.isSpaceDeveloper;
    },

    /**
     * @function goToGalleryView
     * @description Sets a specific layout and loads Gallery View state
     * @param {boolean} showCardLayout - True if view should card layout, false for list view
     * @returns {*|void}
     */
    goToGalleryView: function (showCardLayout) {
      this.model.showCardLayout = showCardLayout;
      return this.$state.go('cf.applications.list.gallery-view');
    }

  });
})();
