(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application')
    .directive('deployLocation', deployLocation);

  /**
   * @memberof cloud-foundry.view.applications.application
   * @name deployLocation
   * @description
   * @returns {object} The space-picker directive definition object
   */
  function deployLocation() {
    return {
      bindToController: true,
      controller: DeployLocationController,
      controllerAs: 'deployLocation',
      templateUrl: 'plugins/cloud-foundry/view/util/deploy-location/deploy-location.html',
      scope: {
        serviceInstances: '=',
        serviceInstance: '=?',
        organisation: '=?',
        space: '=?'
      }
    };
  }

  /**
   * @memberof cloud-foundry.view.applications.application
   * @name DeployLocationController
   * @constructor
   * @param {object} $scope - Angular $scope
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} cfOrganizationModel - the cfOrganizationModel service
   * @param {object} cfUtilsService - Utilities for cloud foundries
   */
  function DeployLocationController($scope, modelManager, cfOrganizationModel, cfUtilsService) {

    var vm = this;

    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    init();

    function init() {
      vm.organizations = [];
      vm.spaces = [];

      if (!vm.serviceInstance &&
        appModel.filterParams.cnsiGuid &&
        appModel.filterParams.cnsiGuid !== 'all') {
        // Find the option to set. If the user has no permissions this may be null
        var preSelectedService = _.find(vm.serviceInstances, {value: {guid: appModel.filterParams.cnsiGuid}}) || {};
        vm.serviceInstance = preSelectedService.value;
      }

      vm.stopWatchServiceInstance = $scope.$watch(function () {
        return vm.serviceInstance;
      }, function (serviceInstance) {
        vm.organization = null;
        vm.space = null;
        if (serviceInstance) {
          getOrganizations();
        }
      });

      vm.stopWatchOrganization = $scope.$watch(function () {
        return vm.organization;
      }, function (organization) {
        vm.space = null;
        if (organization) {
          getSpacesForOrganization(organization.metadata.guid);
        }
      });

    }

    /**
     * @function getOrganizations
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get organizations
     * @returns {promise} A resolved/rejected promise
     */
    function getOrganizations() {
      var cnsiGuid = vm.serviceInstance.guid;
      vm.organizations.length = 0;

      return cfOrganizationModel.listAllOrganizations(cnsiGuid)
        .then(function (organizations) {
          // Filter out organizations in which user does not
          // have any space where they aren't a developer
          // NOTE: This is unnecessary for admin users, and will fail
          // because the userSummary doesn't contain organization_guid data
          var filteredOrgs = organizations;
          if (!authModel.isAdmin(cnsiGuid)) {
            filteredOrgs = _.filter(organizations, function (organization) {
              // Retrieve filtered list of Spaces where the user is a developer
              var orgGuid = organization.metadata.guid;
              var filteredSpaces = _.filter(authModel.principal[cnsiGuid].userSummary.spaces.all,
                {entity: {organization_guid: orgGuid}});
              return filteredSpaces.length > 0;
            });
          }
          [].push.apply(vm.organizations, _.map(filteredOrgs, cfUtilsService.selectOptionMapping));

          if (!vm.organization &&
            appModel.filterParams.orgGuid &&
            appModel.filterParams.orgGuid !== 'all') {
            // Find the option to set. If the user has no permissions this may be null
            var preSelectedOrg = _.find(vm.organizations, {value: {metadata: {guid: appModel.filterParams.orgGuid}}}) || {};
            vm.organization = preSelectedOrg.value;
          }
        });
    }

    /**
     * @function getSpacesForOrganization
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get spaces for organization
     * @param {string} guid - the organization GUID
     * @returns {promise} A resolved/rejected promise
     */
    function getSpacesForOrganization(guid) {
      var cnsiGuid = vm.serviceInstance.guid;
      vm.spaces.length = 0;

      return cfOrganizationModel.listAllSpacesForOrganization(cnsiGuid, guid)
        .then(function (spaces) {

          // Filter out spaces in which user is not a Space Developer
          var filteredSpaces = spaces;
          if (!authModel.isAdmin(cnsiGuid)) {
            filteredSpaces = _.filter(authModel.principal[cnsiGuid].userSummary.spaces.all,
              {entity: {organization_guid: guid}});
          }
          [].push.apply(vm.spaces, _.map(filteredSpaces, cfUtilsService.selectOptionMapping));

          if (!vm.space &&
            appModel.filterParams.spaceGuid &&
            appModel.filterParams.spaceGuid !== 'all') {
            // Find the option to set. If the user has no permissions this may be null
            var preSelectedOrg = _.find(vm.spaces, {value: {metadata: {guid: appModel.filterParams.spaceGuid}}}) || {};
            vm.space = preSelectedOrg.value;
          }
        });
    }

  }

})();
