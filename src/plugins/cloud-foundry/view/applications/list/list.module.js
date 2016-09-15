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
  function ApplicationsListController($scope, $interpolate, $state, $timeout, modelManager, eventService, errorService, utils) {
    var that = this;
    this.$interpolate = $interpolate;
    this.$timeout = $timeout;
    this.modelManager = modelManager;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.eventService = eventService;
    this.errorService = errorService;
    this.ready = false;
    this.loading = true;
    this.currentPage = 0;
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
      total: 0,
      text: {
        nextBtn: gettext('Next'),
        prevBtn: gettext('Previous')
      }
    };

    function init() {
      that._setClusters();
      that._setOrgs();
      that._setSpaces();
      that._reload();
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
     * @function _resetPagination
     * @description reset pagination
     * @returns {promise} A promise
     * @private
     */
    _resetPagination: function () {
      var that = this;
      this.loading = true;
      this.currentPage = 0;
      this.paginationProperties.total = 0;

      return this.model.resetPagination().
        finally(function () {
          that.paginationProperties.total = that.model.pagination.totalPage;
          that.loading = false;
        });
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
          that.currentPage = page;
          that.ready = true;
          that.loading = false;
        });
    },

    /**
     * @function reloadPage
     * @description Reload current page
     * @returns {promise} A promise
     * @public
     */
    reloadPage: function () {
      return this._loadPage(this.currentPage);
    },

    /**
     * @function _reload
     * @description Reload
     * @private
     */
    _reload: function () {
      var that = this;

      this._resetPagination().then(function () {
        if (that.model.pagination.totalPage) {
          return that._loadPage(1);
        }
      });
    },

    /**
     * @function _handleErrors
     * @description Check the response to see if any of the calls returned an error
     * @param {object} data - applications model data object
     * @returns {void}
     * @orivate
     */
    _handleErrors: function (data) {
      var that = this;
      var errors = [];
      if (data.applications) {
        _.each(data.applications, function (result, cnsiGuid) {
          if (result.error) {
            // This request failed
            if (that.userCnsiModel.serviceInstances[cnsiGuid]) {
              errors.push(that.userCnsiModel.serviceInstances[cnsiGuid].name);
            }
          }
        });
      }
      if (errors.length === 1) {
        var errorMessage = 'The Console could not connect to the endpoint named "{{name}}". Try reconnecting to this endpoint to resolve this problem.';
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
