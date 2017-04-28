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
   * @param {object} $interpolate - the angular $interpolate service
   * @param {object} $state - the UI router $state service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $q - the angular $q promise service
   * @param {object} $window - the angular $window service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.appErrorService} appErrorService - the error service
   * @param {object} appUtilsService - the appUtilsService service
   * @param {helion.framework.widgets.frameworkDetailView} frameworkDetailView - The console's frameworkDetailView service
   * @param {object} cfOrganizationModel - the cfOrganizationModel service
   * @property {object} model - the Cloud Foundry Applications Model
   */
  function ApplicationsListController($scope, $interpolate, $state, $timeout, $q, $window, modelManager,
                                      appErrorService, appUtilsService, frameworkDetailView,
                                      cfOrganizationModel) {
    var vm = this;

    var authModel = modelManager.retrieve('cloud-foundry.model.auth');
    vm.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    // Width at which we automatically switch to the grid layout
    var FORCE_GRID_LAYOUT_WIDTH = 640;
    var previousLayout = false;

    vm.model = modelManager.retrieve('cloud-foundry.model.application');
    vm.loading = true;
    vm.isSpaceDeveloper = false;
    vm.clusters = [{label: 'All Endpoints', value: 'all'}];
    vm.organizations = [{label: 'All Organizations', value: 'all'}];
    vm.spaces = [{label: 'All Spaces', value: 'all'}];
    vm.isEndpointsDashboardAvailable = appUtilsService.isPluginAvailable('endpointsDashboard');
    vm.filter = {
      cnsiGuid: 'all',
      orgGuid: 'all',
      spaceGuid: 'all'
    };
    vm.paginationProperties = {
      callback: function (page) {
        return _loadPage(page);
      },
      total: _.ceil(vm.model.cachedApplications.length / vm.model.pageSize),
      pageNumber: _.get(vm.model, 'appPage', 1),
      text: {
        nextBtn: gettext('Next'),
        prevBtn: gettext('Previous')
      }
    };
    // If we have previous apps show the stale values from cache. This avoids showing a blank screen for the majority
    // use case where nothing has changed.
    vm.ready = vm.model.hasApps;
    // Force card layout on smaller screen sizes - listen for resize events
    vm.forceCardLayout = $window.innerWidth <= FORCE_GRID_LAYOUT_WIDTH;

    vm.getNoAppsMessage = getNoAppsMessage;
    vm.getEndpointsLink = getEndpointsLink;
    vm.setCluster = setCluster;
    vm.setOrganization = setOrganization;
    vm.setSpace = setSpace;
    vm.setText = setText;
    vm.toggleFilterPanel = toggleFilterPanel;
    vm.resetFilter = resetFilter;
    vm.isAdminInAnyHcf = isAdminInAnyHcf;
    vm.showAddApplicationButton = showAddApplicationButton;
    vm.addApplication = addApplication;
    vm.disableAddApplicationButton = disableAddApplicationButton;
    vm.goToGalleryView = goToGalleryView;

    angular.element($window).on('resize', onResize);

    // Ensure any app errors we have set are cleared when the scope is destroyed
    $scope.$on('$destroy', function () {
      appErrorService.clearAppError();
      // Ensure that remove the resize handler on the window
      angular.element($window).off('resize', onResize);
    });

    appUtilsService.chainStateResolve('cf.applications.list', $state, init);

    function init() {
      var serviceInstances = _.values(vm.userCnsiModel.serviceInstances);
      for (var i = 0; i < serviceInstances.length; i++) {
        var cluster = serviceInstances[i];
        if (authModel.doesUserHaveRole(cluster.guid, authModel.roles.space_developer)) {
          vm.isSpaceDeveloper = true;
          break;
        }
      }

      return $q.resolve()
        .then(function () {
          vm.filter.text = vm.model.filterParams.text;
        })
        .then(_.bind(_setClusters, vm))
        .then(_.bind(_setOrgs, vm))
        .then(_.bind(_setSpaces, vm))
        .then(_.bind(_reload, vm, true))
        .finally(function () {
          // Ensure ready is always set after initial load. Ready will show filters, no services/app message, etc
          vm.ready = true;
        });
    }

    function onResize() {
      var shouldForceCardLayout = $window.innerWidth <= FORCE_GRID_LAYOUT_WIDTH;
      if (shouldForceCardLayout !== vm.forceCardLayout) {
        vm.forceCardLayout = shouldForceCardLayout;
        $scope.$apply(function () {
          if (vm.forceCardLayout) {
            previousLayout = vm.model.showCardLayout;
            goToGalleryView(true);
          } else {
            goToGalleryView(previousLayout);
          }
        });
      }
    }

    /**
     * @function getNoAppsMessage
     * @description Get the message to display when there are no apps
     * @returns {string} No Apps message that is contextualised to the current filter
     * @public
     */
    function getNoAppsMessage() {
      var text = gettext('You have no applications');
      if (vm.model.filterParams.cnsiGuid !== 'all') {
        if (vm.model.filterParams.orgGuid !== 'all') {
          if (vm.model.filterParams.spaceGuid !== 'all') {
            text = gettext('This space has no applications');
          } else {
            text = gettext('This organization has no applications');
          }
        } else {
          text = gettext('This endpoint has no applications');
        }
      }
      return text +
        (vm.model.filterParams.text && vm.model.filterParams.text.length ? ' matching the search term.' : '.');
    }

    function getEndpointsLink() {
      if (vm.model.clusterCount === 0 && vm.isEndpointsDashboardAvailable) {
        return $state.go('endpoint.dashboard');
      }
      var hcfs = _.filter(vm.userCnsiModel.serviceInstances, {cnsi_type: 'hcf'});
      if (hcfs.length === 1) {
        return $state.go('endpoint.clusters.cluster.detail.organizations', {guid: hcfs[0].guid});
      }
      return $state.go('endpoint.clusters.tiles');
    }

    /**
     * @function _setClusters
     * @description Set the cluster filter list
     * @returns {promise}
     * @private
     */
    function _setClusters() {
      // get the list of connected HCF endpoints
      vm.clusters.length = 1;
      var clusters = _.chain(vm.userCnsiModel.serviceInstances)
        .values()
        .filter({cnsi_type: 'hcf'})
        .map(function (o) {
          return {label: o.name, value: o.guid};
        })
        .value();
      [].push.apply(vm.clusters, clusters);
      vm.model.clusterCount = clusters.length;

      // Reset filtered cluster if it's no longer valid
      if (!_.find(vm.clusters, {value: vm.model.filterParams.cnsiGuid})) {
        vm.model.filterParams.cnsiGuid = 'all';
      }

      // Check to see if the set of clusters has changed
      var clusterGuids = _.map(clusters, 'value');
      if (vm.model.filterLastCluster) {
        var intersection = _.intersection(vm.model.filterLastCluster, clusterGuids);
        if (vm.model.filterLastCluster.length !== intersection.length || clusterGuids.length !== intersection.length) {
          // Set of GUIDs has changed, so reset the filter
          vm.model.filterParams.cnsiGuid = 'all';
        }
      }

      // Select the previous filter value or first cluster in list
      if (vm.model.filterParams.cnsiGuid !== 'all') {
        vm.filter.cnsiGuid = vm.model.filterParams.cnsiGuid;
      } else if (vm.model.clusterCount === 1) {
        vm.model.filterParams.cnsiGuid = clusters[0].value;
        vm.filter.cnsiGuid = vm.model.filterParams.cnsiGuid;
      }

      vm.model.filterLastCluster = clusterGuids;

      return $q.resolve();
    }

    /**
     * @function _setOrgs
     * @description Set the org filter list
     * @returns {promise} A promise
     * @private
     */
    function _setOrgs() {

      vm.organizations.length = 1;
      if (vm.model.filterParams.cnsiGuid !== 'all') {
        return cfOrganizationModel.listAllOrganizations(vm.model.filterParams.cnsiGuid)
          .then(function (newOrgs) {
            var orgs = _.map(newOrgs, _selectMapping);
            [].push.apply(vm.organizations, orgs);

            // Reset filtered organization if it's no longer valid
            if (!_.find(vm.organizations, {value: vm.model.filterParams.orgGuid})) {
              vm.model.filterParams.orgGuid = 'all';
            }

            // Select the previous filter value or first organization in list
            if (vm.model.filterParams.orgGuid !== 'all') {
              vm.filter.orgGuid = vm.model.filterParams.orgGuid;
            } else if (orgs.length === 1) {
              vm.model.filterParams.orgGuid = orgs[0].value;
              vm.filter.orgGuid = vm.model.filterParams.orgGuid;
            }
          });
      } else {
        return $q.resolve();
      }
    }

    /**
     * @function _setSpaces
     * @description Set the space filter list
     * @returns {promise} A promise
     * @private
     */
    function _setSpaces() {

      vm.spaces.length = 1;
      if (vm.model.filterParams.cnsiGuid !== 'all' &&
        vm.model.filterParams.orgGuid !== 'all') {
        return cfOrganizationModel.listAllSpacesForOrganization(
          vm.model.filterParams.cnsiGuid,
          vm.model.filterParams.orgGuid
        )
          .then(function (newSpaces) {
            var spaces = _.map(newSpaces, _selectMapping);
            [].push.apply(vm.spaces, spaces);

            // Reset filtered space if it's no longer valid
            if (!_.find(vm.spaces, {value: vm.model.filterParams.spaceGuid})) {
              vm.model.filterParams.spaceGuid = 'all';
            }

            // Select the previous filter value or first space in list
            if (vm.model.filterParams.spaceGuid !== 'all') {
              vm.filter.spaceGuid = vm.model.filterParams.spaceGuid;
            } else if (spaces.length === 1) {
              vm.model.filterParams.spaceGuid = spaces[0].value;
              vm.filter.spaceGuid = vm.model.filterParams.spaceGuid;
            }
          });
      } else {
        return $q.resolve();
      }
    }

    /**
     * @function _setFilter
     * @description Set filter in application model and this module
     * @param {object} updatedFilter - the updated filter
     * @returns {void}
     * @private
     */
    function _setFilter(updatedFilter) {
      angular.extend(vm.model.filterParams, updatedFilter);
      angular.extend(vm.filter, updatedFilter);
    }

    /**
     * @function _loadPage
     * @description Retrieve apps with given page number
     * @param {number} page - page number
     * @returns {promise} A promise
     * @private
     */
    function _loadPage(page) {

      vm.loading = true;

      return vm.model.loadPage(page)
        .finally(function () {
          vm.loading = false;
          _handleErrors();
        });
    }

    /**
     * @function _reload
     * @description Reload the application wall
     * @param {boolean=} retainPage Attempt to retain the current page after pagination has reloaded
     * @param {boolean=} fromCache Reset pagination (and apps) from cache instead of service
     * @returns {promise} A promise
     * @private
     */
    function _reload(retainPage, fromCache) {

      var reloadPage = retainPage ? vm.model.appPage : 1;
      vm.loading = true;

      return vm.model.resetPagination(fromCache)
        .then(function () {
          vm.paginationProperties.total = _.ceil(vm.model.filteredApplications.length / vm.model.pageSize);

          //Ensure page number is valid and load it
          reloadPage = reloadPage < 1 ? 1 : reloadPage;
          reloadPage = reloadPage > vm.paginationProperties.total ? vm.paginationProperties.total : reloadPage;
          if (reloadPage) {
            _loadPage(reloadPage).then(function () {
              vm.paginationProperties.pageNumber = reloadPage;
            });
          }
        })
        .catch(function (error) {
          vm.paginationProperties.total = 0;
          vm.paginationProperties.pageNumber = 0;
          return $q.reject(error);
        })
        .finally(function () {
          vm.loading = false;
        });
    }

    /**
     * @function _handleErrors
     * @description Check the user's service instance data to see if any services returned an error
     * @returns {void}
     * @orivate
     */
    function _handleErrors() {

      var errors = [];
      var servicesWithErrors = _.filter(vm.userCnsiModel.serviceInstances, {cnsi_type: 'hcf', error: true});
      _.each(servicesWithErrors, function (cnsi) {
        if (vm.filter.cnsiGuid === cnsi.guid || vm.filter.cnsiGuid === 'all') {
          errors.push(cnsi.name);
        }
      });
      if (errors.length === 1) {
        var errorMessage = gettext('The Console could not connect to the endpoint named "{{name}}". Try reconnecting to this endpoint to resolve this problem.');
        appErrorService.setAppError($interpolate(errorMessage)({name: errors[0]}));
      } else if (errors.length > 1) {
        appErrorService.setAppError(gettext('The Console could not connect to multiple endpoints. Use the Endpoints dashboard to manage your endpoints.'));
      } else {
        appErrorService.clearAppError();
      }
    }

    /**
     * @function getClusterOrganizations
     * @description Get organizations for selected cluster
     * @returns {void}
     * @public
     */
    function setCluster() {

      vm.organizations.length = 1;
      vm.model.filterParams.cnsiGuid = vm.filter.cnsiGuid;
      // Reload if we're coming FROM a situation where we won't have all apps (previously filtered by org/space)
      var needToReload = !_.isMatch(vm.filter, {orgGuid: 'all', spaceGuid: 'all'});
      _setFilter({orgGuid: 'all', spaceGuid: 'all'});
      $q.resolve()
        .then(_.bind(_setOrgs, vm))
        .then(_.bind(_setSpaces, vm))
        .then(function () {
          // Reload if we're going TO a situation where we won't have all apps (filtered by org/space). _setOrg may have
          // changed the org and space filter
          needToReload = needToReload || !_.isMatch(vm.filter, {orgGuid: 'all', spaceGuid: 'all'});

          if (needToReload) {
            _reload();
          } else {
            if (vm.filter.cnsiGuid === 'all') {
              vm.model.resetFilter();
            } else {
              vm.model.filterByCluster(vm.filter.cnsiGuid);
            }
            vm.paginationProperties.pageNumber = 1;
            vm.paginationProperties.total = _.ceil(vm.model.filteredApplications.length / vm.model.pageSize);
            _loadPage(1);
          }
        });
    }

    /**
     * @function getOrganizationSpaces
     * @description Get spaces for selected organization
     * @returns {void}
     * @public
     */
    function setOrganization() {

      vm.spaces.length = 1;
      vm.model.filterParams.orgGuid = vm.filter.orgGuid;
      _setFilter({spaceGuid: 'all'});
      _setSpaces().then(function () {
        _reload();
      });
    }

    function setSpace() {
      vm.model.filterParams.spaceGuid = vm.filter.spaceGuid;
      _reload();
    }

    function setText() {
      vm.model.filterParams.text = vm.filter.text;
      _reload(true, true);
    }

    function toggleFilterPanel() {
      vm.model.hideFilterPanel = !vm.model.hideFilterPanel;
    }

    /**
     * @function resetFilter
     * @description Reset the filter to all
     * @returns {void}
     * @public
     */
    function resetFilter() {

      var clusters = vm.clusters;

      vm.clusters = [];
      $timeout(function () {
        vm.clusters = clusters;
        _setFilter({cnsiGuid: 'all', text: ''});
        setCluster();
      }, 100);
    }

    /**
     * @function _selectMapping
     * @description Select mapping for select input options
     * @param {object} obj - the object to get mapping for
     * @returns {object} Select input option mapping
     * @private
     */
    function _selectMapping(obj) {
      return {
        label: obj.entity.name,
        value: obj.metadata.guid
      };
    }

    /**
     * @function isAdminInAnyHcf
     * @description Helper to detect if user is an admin in any connected HCF
     * @returns {boolean} true if the user is connected to any HCF as an admin
     */
    function isAdminInAnyHcf() {
      for (var guid in vm.userCnsiModel.serviceInstances) {
        if (!vm.userCnsiModel.serviceInstances.hasOwnProperty(guid)) {
          continue;
        }
        if (vm.userCnsiModel.serviceInstances[guid].cnsi_type !== 'hcf') {
          continue;
        }
        if (authModel.isAdmin(guid)) {
          return true;
        }
      }
    }

    /**
     * @function showAddApplicationButton
     * @description Implements the logic for showing the `Add Application` button
     * @returns {boolean} true if the user is an admin or a Space developer to any HCF
     */
    function showAddApplicationButton() {
      if (isAdminInAnyHcf()) {
        return true;
      }
      return !disableAddApplicationButton();
    }

    /**
     * @function addApplication
     * @description Shows the Add Application dialog
     */
    function addApplication() {
      frameworkDetailView(
        {
          templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/add-app-dialog.html',
          dialog: true,
          class: 'dialog-form-large'
        }
      );
    }

    /**
     * @function disableAddApplicationButton
     * @description Implements the logic for disabling the `Add Application` button
     * @returns {boolean} true is App module is initialising,
     * there no connected endpoints or user is not a space developer
     */
    function disableAddApplicationButton() {
      return !vm.ready || vm.model.clusterCount <= 0 || !vm.isSpaceDeveloper;
    }

    /**
     * @function goToGalleryView
     * @description Sets a specific layout and loads Gallery View state
     * @param {boolean} showCardLayout - True if view should card layout, false for list view
     * @returns {*|void}
     */
    function goToGalleryView(showCardLayout) {
      vm.model.showCardLayout = showCardLayout;
      return $state.go('cf.applications.list.gallery-view');
    }

  }
})();
