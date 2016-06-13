(function() {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.summary', {
      url: '/summary',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/summary/summary.html',
      controller: ApplicationSummaryController,
      controllerAs: 'applicationSummaryCtrl'
    });
  }

  ApplicationSummaryController.$inject = [
    'app.model.modelManager',
    '$stateParams',
    'helion.framework.widgets.detailView'

  ];

  /**
   * @name ApplicationSummaryController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationSummaryController(modelManager, $stateParams, detailView) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.id = $stateParams.guid;
    this.detailView = detailView;
    this.userCnsiModel.list();
  }

  angular.extend(ApplicationSummaryController.prototype, {
    /**
     * @function isWebLink
     * @description Determine if supplies buildpack url is a web link
     * @param {string} buildpack - buildpack url guid
     * @returns {boolean} Indicating if supplies buildpack is a web link
     * @public
     **/
    isWebLink: function(buildpack) {
      var url = angular.isDefined(buildpack) && buildpack !== null ? buildpack : '';
      url = url.trim().toLowerCase();
      return url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
    },

    /**
     * @function showAddRouteForm
     * @description Show Add a Route form
     * @public
     **/
    showAddRouteForm: function() {

      // Create a map of domain names -> domain guids
      var domains = [];
      this.model.application.summary.available_domains.forEach(function(domain) {
        domains.push({
          label: domain.name,
          value: domain.guid
        });
      });

      var spaceGuid = this.model.application.summary.space_guid;
      var data = {
        host: null,
        port: null,
        path: null,
        space_guid: spaceGuid,
        domain_guid: domains[0].value
      };

      this.detailView(
        {
          templateUrl: 'plugins/cloud-foundry/view/applications/application/summary/add-route/add-route.html',
          title: gettext('Add a Route'),
          controller: 'addRouteController'
        },
        {
          data: data,
          options: {
            domains: domains
          }
        }
      );

    },
    /**
     * @function hideAddRouteForm
     * @description Hide Add a Route form
     * @public
     **/
    hideAddRouteForm: function() {
      this.addRouteFlyoutActive = false;
    }
  });

})();
