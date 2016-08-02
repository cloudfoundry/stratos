(function () {
  'use strict';

  angular
    .module('cloud-foundry.service')
    .run(register);

  register.$inject = [
    'app.service.serviceManager',
    'app.model.modelManager',
    'helion.framework.widgets.dialog.confirm'
  ];

  function register(serviceManager, modelManager, confirmDialog) {
    serviceManager.register('cloud-foundry.service.route',
      new RoutesService(modelManager, confirmDialog));
  }

  /**
   * @name RoutesService
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirm dialog service
   * @property {object} routesModel - the HCF routes model management service
   * @property {cloud-foundry.view.applications.application.summary.addRoutes} addRoutesService - add routes service
   * @property {helion.framework.widgets.dialog.confirm} confirmDialog - the confirm dialog service
   */
  function RoutesService(modelManager, confirmDialog) {
    this.routesModel = modelManager.retrieve('cloud-foundry.model.route');
    this.confirmDialog = confirmDialog;
  }

  angular.extend(RoutesService.prototype, {

    /**
     * @function getRouteId
     * @description tracking function for routes
     * @param {object} route route or route entity
     * @returns {string} route ID
     */
    getRouteId: function (route) {
      var routeEntity = _.get(route, 'entity', route);
      var domain = _.get(routeEntity, 'domain.entity', routeEntity.domain);
      var domainName = domain ? domain.name : gettext('Unknown');

      var port = routeEntity.port ? ':' + routeEntity.port : '';

      return 'http://' + routeEntity.host + '.' + domainName + port + routeEntity.path;
    },

    /**
     * @function unmapRoute
     * @description Unmap route from application
     * @param {string} cnsiGuid the cnsi guid of the HCF cluster
     * @param {object} route route metadata
     * @param {object} routeGuid route guid
     * @param {object} appGuid the app guid to unmap this route from
     * @return {promise} confirmation dialogue promise
     */
    unmapRoute: function (cnsiGuid, route, routeGuid, appGuid) {
      var that = this;
      var dialog = this.confirmDialog({
        title: gettext('Unmap Route from Application'),
        description: gettext('Are you sure you want to unmap ') + this.getRouteId(route) + '?',
        buttonText: {
          yes: gettext('Unmap'),
          no: gettext('Cancel')
        },
        callback: function () {
          return that.routesModel.removeAppFromRoute(cnsiGuid, routeGuid, appGuid);
        }
      });
      return dialog.result;
    },

    /**
     * @function deleteRoute
     * @description Unmap and delete route
     * @param {string} cnsiGuid the cnsi guid of the HCF cluster
     * @param {object} route route metadata
     * @param {object} routeGuid route guid
     * @return {promise} confirmation dialogue promise
     */
    deleteRoute: function (cnsiGuid, route, routeGuid) {
      var that = this;
      var dialog = this.confirmDialog({
        title: gettext('Delete Route'),
        description: gettext('Are you sure you want to delete ') + this.getRouteId(route) + '?',
        buttonText: {
          yes: gettext('Delete'),
          no: gettext('Cancel')
        },
        callback: function () {
          return that.routesModel.deleteRoute(cnsiGuid, routeGuid);
        }
      });
      return dialog.result;
    }
  });

})();
