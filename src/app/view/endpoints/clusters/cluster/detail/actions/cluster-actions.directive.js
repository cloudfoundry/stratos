(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('clusterActions', ClusterActions);

  ClusterActions.$inject = [];

  function ClusterActions() {
    return {
      restrict: 'E',
      bindToController: true,
      controller: ClusterActionsController,
      controllerAs: 'clusterActionsCtrl',
      scope: {
        // stateName: '@'
      },
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/actions/cluster-actions.html'
    };
  }

  ClusterActionsController.$inject = [
    'app.model.modelManager',
    '$state',
    '$q',
    'app.utils.utilsService',
    'helion.framework.widgets.dialog.confirm',
    'helion.framework.widgets.asyncTaskDialog',
    '$stateParams'
  ];

  /**
   * @name OrganizationTileController
   * @constructor
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $state - the angular $state service
   * @param {object} $q - the angular $q service
   * @param {object} utils - our utils service
   * @param {object} confirmDialog - our confirmation dialog service
   * @param {object} asyncTaskDialog - our async dialog service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function ClusterActionsController(modelManager, $state, $q, utils, confirmDialog, asyncTaskDialog, $stateParams) {
    var that = this;
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');

    this.stateName = $state.current.name;
    this.clusterGuid = $stateParams.guid;

    function getOrgName(org) {
      return _.get(org, 'details.org.entity.name');
    }

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
                organizationNames: organizationModel.organizationNames[that.clusterGuid]
              }
            },
            function (orgData) {
              if (orgData.name && orgData.name.length > 0) {
                return organizationModel.createOrganization(that.clusterGuid, orgData.name);
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

          var contextData;

          // Create organization is context sensitive!
          var selectedOrg;
          if ($stateParams.organization) {
            selectedOrg = getOrgName(organizationModel.organizations[that.clusterGuid][$stateParams.organization]);
          } else {
            // Pre-select the most recently created organization
            var sortedOrgs = _.sortBy(organizationModel.organizations[that.clusterGuid], function (org) {
              return -org.details.created_at;
            });
            selectedOrg = getOrgName(sortedOrgs[0]);
          }

          function setOrganization() {
            console.log('Org changed!' + contextData.organization);
          }

          function addSpace() {
            if (contextData.spaces.length < 10) {
              contextData.spaces.push('');
            }
          }

          function removeSpace() {
            contextData.spaces.length--;
          }

          contextData = {
            organization: selectedOrg,
            organizations: _.map(organizationModel.organizationNames[that.clusterGuid], function (name) {
              return {
                label: name,
                value: name
              };
            }),
            spaceNames: [],
            spaces: [''],
            setOrganization: setOrganization,
            addSpace: addSpace,
            removeSpace: removeSpace
          };
          return asyncTaskDialog(
            {
              title: gettext('Create Space'),
              templateUrl: 'app/view/endpoints/clusters/cluster/detail/actions/create-space.html',
              buttonTitles: {
                submit: gettext('Create')
              }
            },
            {
              data: contextData
            },
            function (spaceData) {
              if (spaceData.name && spaceData.name.length > 0) {
                return $q.resolve('Valid Name!');
              } else {
                return $q.reject('Invalid Name!');
              }
            }
          );
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Tree'
      },
      {
        name: gettext('Assign User(s)'),
        disabled: true,
        execute: function () {
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Add_user'
      }
    ];

    /**
     * Enable actions based on admin status
     * N.B. when finer grain ACLs are wired in this should be updated
     * */
    function enableActions() {
      if (stackatoInfo.info.endpoints.hcf[that.clusterGuid].user.admin) {
        _.forEach(that.clusterActions, function (action) {
          action.disabled = false;
        });
        // Disable these until implemented!
        that.clusterActions[2].disabled = true;
      }
    }

    function init() {
      enableActions();
      return $q.resolve();
    }

    utils.chainStateResolve(this.stateName, $state, init);

  }

})();
