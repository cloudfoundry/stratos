(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list', [
      'cloud-foundry.view.applications.list.gallery-view',
      'cloud-foundry.view.applications.list.table-view'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.list', {
      url: '/list',
      templateUrl: 'plugins/cloud-foundry/view/applications/list/list.html',
      controller: ApplicationsListController,
      controllerAs: 'applicationsListCtrl'
    });
  }

  ApplicationsListController.$inject = [
    '$scope',
    '$interpolate',
    '$state',
    '$timeout',
    '$q',
    'app.model.modelManager',
    'app.event.eventService',
    'app.error.errorService',
    'app.utils.utilsService'
  ];

  /**
   * @name ApplicationsListController
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {object} $interpolate - the angular $interpolate service
   * @param {object} $state - the UI router $state service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $q - the angular $q promise service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.event.eventService} eventService - the event bus service
   * @param {app.error.errorService} errorService - the error service
   * @param {object} utils - the utils service
   * @property {object} $interpolate - the angular $interpolate service
   * @property {object} $timeout - the angular $timeout service
   * @property {app.model.modelManager} modelManager - the Model management service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {app.event.eventService} eventService - the event bus service
   * @property {app.error.errorService} errorService - the error service
   */
  function ApplicationsListController($scope, $interpolate, $state, $timeout, $q, modelManager, eventService, errorService, utils) {
    var that = this;
    this.$interpolate = $interpolate;
    this.$timeout = $timeout;
    this.$q = $q;
    this.modelManager = modelManager;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.eventService = eventService;
    this.errorService = errorService;
    this.loading = true;
    this.isSpaceDeveloper = false;
    this.clusters = [{label: 'All Endpoints', value: 'all'}];
    this.organizations = [{label: 'All Organizations', value: 'all'}];
    this.spaces = [{label: 'All Spaces', value: 'all'}];
    this.filter = {
      cnsiGuid: 'all',
      orgGuid: 'all',
      spaceGuid: 'all'
    };
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');

    this.paginationProperties = {
      callback: function (page) {
        return that._loadPage(page);
      },
      total: _.get(that.model, 'pagination.totalPage', 0),
      pageNumber: _.get(that.model, 'appPage', 1),
      text: {
        nextBtn: gettext('Next'),
        prevBtn: gettext('Previous')
      }
    };

    // If we have previous apps show the stale values from cache. This avoids showing a blank screen for the majority
    // use case where nothing has changed.
    this.ready = this.model.hasApps;

    function init() {
      that._setClusters();
      that._setOrgs();
      that._setSpaces();
      that._reload(true).finally(function () {
        // Ensure ready is always set after initial load. Ready will show filters, no services/app message, etc
        that.ready = true;
      });
      var serviceInstances = _.values(that.userCnsiModel.serviceInstances);
      for (var i = 0; i < serviceInstances.length; i++) {
        var cluster = serviceInstances[i];
        if (that.authModel.doesUserHaveRole(cluster.guid, that.authModel.roles.space_developer)) {
          that.isSpaceDeveloper = true;
          break;
        }
      }
    }

    utils.chainStateResolve('cf.applications.list', $state, init);

    // Ensure any app errors we have set are cleared when the scope is destroyed
    $scope.$on('$destroy', function () {
      that.errorService.clearAppError();
    });
  }

  angular.extend(ApplicationsListController.prototype, {
    /**
     * @function _setClusters
     * @description Set the cluster filter list
     * @returns {void}
     * @private
     */
    _setClusters: function () {
      // get the list of connected HCF endpoints
      this.clusters.length = 1;
      var clusters = _.chain(this.userCnsiModel.serviceInstances)
        .values()
        .filter({cnsi_type: 'hcf'})
        .map(function (o) {
          return {label: o.name, value: o.guid};
        })
        .value();
      [].push.apply(this.clusters, clusters);
      this.model.clusterCount = clusters.length;

      if (this.model.filterParams.cnsiGuid !== 'all') {
        this.filter.cnsiGuid = this.model.filterParams.cnsiGuid;
      }
    },

    /**
     * @function _setOrgs
     * @description Set the org filter list
     * @returns {promise} A promise
     * @private
     */
    _setOrgs: function () {
      var that = this;
      if (this.model.filterParams.cnsiGuid !== 'all') {
        var orgModel = this.modelManager.retrieve('cloud-foundry.model.organization');
        return orgModel.listAllOrganizations(this.model.filterParams.cnsiGuid)
          .then(function (newOrgs) {
            var orgs = _.map(newOrgs, that._selectMapping);
            [].push.apply(that.organizations, orgs);

            if (that.model.filterParams.orgGuid !== 'all') {
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
      if (this.model.filterParams.cnsiGuid !== 'all' &&
        this.model.filterParams.orgGuid !== 'all') {
        var orgModel = this.modelManager.retrieve('cloud-foundry.model.organization');
        return orgModel.listAllSpacesForOrganization(
          this.model.filterParams.cnsiGuid,
          this.model.filterParams.orgGuid
        )
          .then(function (newSpaces) {
            var spaces = _.map(newSpaces, that._selectMapping);
            [].push.apply(that.spaces, spaces);

            if (that.model.filterParams.spaceGuid !== 'all') {
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
     * @param {object} cachedData - cached page data
     * @returns {promise} A promise
     * @private
     */
    _loadPage: function (page, cachedData) {
      var that = this;
      this.loading = true;

      return this.model.loadPage(page, cachedData)
        .finally(function () {
          that.loading = false;
          that._handleErrors();
        });
    },

    /**
     * @function _reload
     * @description Reload the application wall
     * @param {boolean=} retainPage Attempt to retain the current page after pagination has reloaded
     * @returns {promise} A promise
     * @private
     */
    _reload: function (retainPage) {
      var that = this;
      var reloadPage = retainPage ? that.model.appPage : 1;

      this.loading = true;

      // Recreate the pagination model
      return this.model.resetPagination()
        .catch(function (error) {
          // Clear everything
          that.paginationProperties.total = 0;
          that.paginationProperties.pageNumber = 0;
          return that.$q.reject(error);
        })
        .then(function (cacheData) {
          // Only in the success case is the pagination model set correctly. If the call is rejected pagination is
          // likely to be undefined
          that.paginationProperties.total = that.model.pagination.totalPage;

          // If there are pages attempt to load one of them (either the previous page or first one, see above)
          if (that.model.pagination.totalPage) {

            //Ensure page number is valid
            reloadPage = reloadPage < 1 ? 1 : reloadPage;
            reloadPage = reloadPage > that.model.pagination.pages.length ? that.model.pagination.pages.length : reloadPage;

            return that._loadPage(reloadPage, cacheData)
              .then(function () {
                // ensure the paginator shows the correct page
                that.paginationProperties.pageNumber = reloadPage;
              })
              .finally(function () {
                return cacheData;
              });
          } else {
            that.paginationProperties.total = 0;
            that.paginationProperties.pageNumber = 0;
            that._handleErrors();
            return cacheData;
          }
        }).finally(function () {
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
      var servicesWithErrors = _.filter(this.userCnsiModel.serviceInstances, {cnsi_type: 'hcf', error: true});
      _.each(servicesWithErrors, function (cnsi) {
        if (that.filter.cnsiGuid === cnsi.guid || that.filter.cnsiGuid === 'all') {
          errors.push(cnsi.name);
        }
      });
      if (errors.length === 1) {
        var errorMessage = gettext('The Console could not connect to the endpoint named "{{name}}". Try reconnecting to this endpoint to resolve this problem.');
        that.errorService.setAppError(that.$interpolate(errorMessage)({name: errors[0]}));
      } else if (errors.length > 1) {
        that.errorService.setAppError(gettext('The Console could not connect to multiple endpoints. Use the Endpoints dashboard to manage your endpoints.'));
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
      this.organizations.length = 1;
      this.model.filterParams.cnsiGuid = this.filter.cnsiGuid;
      this._setFilter({orgGuid: 'all', spaceGuid: 'all'});
      this._setOrgs();
      this._reload();
    },

    /**
     * @function getOrganizationSpaces
     * @description Get spaces for selected organization
     * @returns {void}
     * @public
     */
    setOrganization: function () {
      this.spaces.length = 1;
      this.model.filterParams.orgGuid = this.filter.orgGuid;
      this._setFilter({spaceGuid: 'all'});
      this._setSpaces();
      this._reload();
    },

    setSpace: function () {
      this.model.filterParams.spaceGuid = this.filter.spaceGuid;
      this._reload();
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
        that._setFilter({cnsiGuid: 'all'});
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

    showAddApplicationButton: function () {

      // If we're not ready or there is no
      // connected cluster, hide the button
      if (this.ready && this.model.clusterCount > 0) {
        return this.isSpaceDeveloper;
      }

      return false;
    }
  });
})();
