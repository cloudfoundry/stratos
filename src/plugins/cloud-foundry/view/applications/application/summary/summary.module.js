(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute ($stateProvider) {
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
    'cloud-foundry.view.applications.application.summary.addRoutes',
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @name ApplicationSummaryController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {cloud-foundry.view.applications.application.summary.addRoutes} addRoutesService - add routes service
   * @param confirmDialog
   * @property {cloud-foundry.model.application} model - the Cloud Foundry Applications Model
   * @property {app.model.serviceInstance.user} userCnsiModel - the user service instance model
   * @property {string} id - the application GUID
   * @property {cloud-foundry.view.applications.application.summary.addRoutes} addRoutesService - add routes service
   */
  function ApplicationSummaryController (modelManager, $stateParams, addRoutesService, confirmDialog) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.routesModel = modelManager.retrieve('cloud-foundry.model.route');
    this.id = $stateParams.guid;
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.addRoutesService = addRoutesService;
    this.confirmDialog = confirmDialog;
    this.userCnsiModel.list();

    var that = this;
    this.routesActionMenu = [
      {
        name: gettext('Unmap from App'),
        execute: function (route) {
          that.unmapRoute(route);
        }
      },
      {
        name: gettext('Delete Route'),
        execute: function (route) {
          that.deleteRoute(route);
        }
      }
    ];
  }

  angular.extend(ApplicationSummaryController.prototype, {
    /**
     * @function isWebLink
     * @description Determine if supplies buildpack url is a web link
     * @param {string} buildpack - buildpack url guid
     * @returns {boolean} Indicating if supplies buildpack is a web link
     * @public
     **/
    isWebLink: function (buildpack) {
      var url = angular.isDefined(buildpack) && buildpack !== null ? buildpack : '';
      url = url.trim().toLowerCase();
      return url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
    },

    /**
     * @function showAddRouteForm
     * @description Show Add a Route form
     * @public
     **/
    showAddRouteForm: function () {
      this.addRoutesService.add();
    },

    /**
     * @function unmapRoute
     * @description Unmap route from application
     * @param {object} route route metadata
     */
    unmapRoute: function (route) {
      var that = this;
      this.confirmDialog({
        title: gettext('Unmap Route from Application'),
        description: gettext('Are you sure you want to unmap ') + this.getRouteId(route) + '?',
        buttonText: {
          yes: gettext('Delete'),
          no: gettext('Cancel')
        },
        callback: function () {
          that.routesModel.removeAppFromRoute(that.cnsiGuid, route.guid, that.id);
        }
      });
    },

    /**
     * @function deleteRoute
     * @description Unmap and delete route
     * @param {object} route route metadata
     */
    deleteRoute: function (route) {
      var that = this;
      this.confirmDialog({
        title: gettext('Delete Route'),
        description: gettext('Are you sure you want to delete ') + this.getRouteId(route) + '?',
        buttonText: {
          yes: gettext('Delete'),
          no: gettext('Cancel')
        },
        callback: function () {
          that.routesModel.deleteRoute(that.cnsiGuid, route.guid);
        }
      });
    },

    /**
     * @function getRouteId
     * @description tracking function for routes
     * @param {object} route route metadata
     * @returns {string} route ID
       */
    getRouteId: function (route) {
      return route.host + '.' + route.domain.name + route.path;
    }
  });

})();
