(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster', [
      'app.view.endpoints.clusters.cluster.detail',
      'app.view.endpoints.clusters.cluster.organization',
      'ncy-angular-breadcrumb'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster', {
      url: '/:guid',
      abstract: true,
      templateUrl: 'app/view/endpoints/clusters/cluster/cluster.html',
      controller: ClusterController,
      controllerAs: 'clusterController'
    });
  }

  ClusterController.$inject = [
    '$stateParams',
    '$log',
    'app.utils.utilsService',
    '$state',
    '$q',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog',
    'app.view.endpoints.clusters.cluster.assignUsers'
  ];

  function ClusterController($stateParams, $log, utils, $state, $q, modelManager, asyncTaskDialog, assignUsers) {
    var that = this;
    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    var serviceBindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    var privateDomains = modelManager.retrieve('cloud-foundry.model.private-domain');
    var sharedDomains = modelManager.retrieve('cloud-foundry.model.shared-domain');
    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    this.initialized = false;
    this.guid = $stateParams.guid;
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');

    this.getEndpoint = function () {
      return utils.getClusterEndpoint(that.userServiceInstanceModel.serviceInstances[that.guid]);
    };

    this.clusterActions = [
      {
        name: gettext('Create Organization'),
        disabled: true,
        execute: function () {
          return asyncTaskDialog(
            {
              title: gettext('Create Organization'),
              templateUrl: 'app/view/endpoints/clusters/cluster/detail/actions/create-organization.html',
              buttonTitles: {
                submit: gettext('Create')
              }
            },
            {
              data: {
                // Make the form invalid if the name is already taken
                organizationNames: organizationModel.organizationNames[that.guid]
              }
            },
            function (orgData) {
              if (orgData.name && orgData.name.length > 0) {
                return organizationModel.createOrganization(that.guid, orgData.name);
              } else {
                return $q.reject('Invalid Name!');
              }

            }
          );
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Tree'
      },
      {
        name: gettext('Create Space'),
        disabled: true,
        execute: function () {
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Tree'
      },
      {
        name: gettext('Assign User(s)'),
        disabled: true,
        execute: function () {
          assignUsers.assign({
            selectedUsers: {}
          });
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Add_user'
      }
    ];

    /**
     * Enable actions based on admin status
     * N.B. when finer grain ACLs are wired in this should be updated
     * */
    function enableActions() {
      if (stackatoInfo.info.endpoints.hcf[that.guid].user.admin) {
        _.forEach(that.clusterActions, function (action) {
          action.disabled = false;
        });
        // Disable these until implemented!
        that.clusterActions[1].disabled = true;
      }
      that.clusterActions[2].disabled =
        that.clusterActions[2].disabled && _.keys(organizationModel.organizations).length > 0;
    }

    function init() {

      // Cache all organizations associated with this cluster
      var orgPromise = organizationModel.listAllOrganizations(that.guid, {}).then(function (orgs) {
        var allDetailsP = [];
        _.forEach(orgs, function (org) {
          var orgDetailsP = organizationModel.getOrganizationDetails(that.guid, org).catch(function () {
            // Swallow errors for individual orgs
            $log.error('Failed to fetch details for org - ' + org.entity.name);
          });
          allDetailsP.push(orgDetailsP);
        });
        return $q.all(allDetailsP).then(function (val) {
          enableActions();
          that.organizationNames = organizationModel.organizationNames[that.guid];
          return val;
        });
      }).catch(function (error) {
        $log.error('Error while listing organizations', error);
      });

      /* eslint-disable no-warning-comments */
      // TODO (TEAMFOUR-780): There's a few places we call this for the core endpoints screens (before we hit a specific
      // clusters page). Need to reduce all these calls to one and watch cache.
      // Cache all user service instance data. Also used by child states to determine cluster name in breadcrumbs
      /* eslint-enable no-warning-comments */
      var servicesPromise = that.userServiceInstanceModel.list();

      // Needed to show a Space's list of service instances (requires app name, from app guid, from service binding)
      var serviceBindingPromise = serviceBindingModel.listAllServiceBindings(that.guid);

      // Needed to show the domain part of a route's url (which is not included when listing routes via space)
      // This can either be private or shared, we have to check both.
      var privateDomainsPromise = privateDomains.listAllPrivateDomains(that.guid);
      var sharedDomainsPromise = sharedDomains.listAllSharedDomains(that.guid);

      // Reset any cache we may be interested in
      delete appModel.appSummary;

      return $q.all([orgPromise, servicesPromise, serviceBindingPromise, privateDomainsPromise, sharedDomainsPromise])
        .finally(function () {
          that.initialized = true;
        });
    }

    utils.chainStateResolve('endpoint.clusters.cluster', $state, init);
  }

})();
