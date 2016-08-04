(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters')
    .factory('app.view.endpoints.clusters.routesService', RoutesServiceFactory);

  RoutesServiceFactory.$inject = [
    '$log',
    'app.model.modelManager',
    'helion.framework.widgets.dialog.confirm'
  ];

  function RoutesServiceFactory($log, modelManager, confirmDialog) {
    return new RoutesService($log, modelManager, confirmDialog);
  }

  /**
   * @name RoutesService
   * @constructor
   * @param {object} $log - the angular $log service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirm dialog service
   */
  function RoutesService($log, modelManager, confirmDialog) {
    this.$log = $log;
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
     * @param {string} routeGuid route guid
     * @param {string} appGuid the app guid to unmap this route from
     * @returns {promise} promise once execution completed. This could mean confirm dialog was cancelled OR unmap failed
     */
    unmapRoute: function (cnsiGuid, route, routeGuid, appGuid) {
      var that = this;
      var dialog = this.confirmDialog({
        title: gettext('Unmap Route from Application'),
        description: gettext('Are you sure you want to unmap ') + this.getRouteId(route) + '?',
        buttonText: {
          yes: gettext('Unmap'),
          no: gettext('Cancel')
        }
      });
      return dialog.result.then(function () {
        return that.routesModel.removeAppFromRoute(cnsiGuid, routeGuid, appGuid).catch(function (error) {
          that.$log.error('Failed to unmap route: ', routeGuid);
          throw error;
        });
      });
    },

    /**
     * @function deleteRoute
     * @description Unmap and delete route
     * @param {string} cnsiGuid the cnsi guid of the HCF cluster
     * @param {object} route route metadata
     * @param {string} routeGuid route guid
     * @returns {promise} promise once execution completed. This could mean confirm dialog was cancelled OR delete
     * failed
     */
    deleteRoute: function (cnsiGuid, route, routeGuid) {
      var that = this;
      var dialog = this.confirmDialog({
        title: gettext('Delete Route'),
        description: gettext('Are you sure you want to delete ') + this.getRouteId(route) + '?',
        buttonText: {
          yes: gettext('Delete'),
          no: gettext('Cancel')
        }
      });
      return dialog.result.then(function () {
        return that.routesModel.deleteRoute(cnsiGuid, routeGuid).catch(function (error) {
          that.$log.error('Failed to delete route: ', routeGuid);
          throw error;
        });
      });
    }
  });

})();
