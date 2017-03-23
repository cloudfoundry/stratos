(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters')
    .factory('app.view.endpoints.clusters.routesService', RoutesServiceFactory);

  RoutesServiceFactory.$inject = [
    '$q',
    '$log',
    'modelManager',
    'app.view.notificationsService',
    'helion.framework.widgets.dialog.confirm'
  ];

  function RoutesServiceFactory($q, $log, modelManager, notificationsService, confirmDialog) {
    return new RoutesService($q, $log, modelManager, notificationsService, confirmDialog);
  }

  /**
   * @name RoutesService
   * @constructor
   * @param {object} $q - the angular $log service
   * @param {object} $log - the angular $log service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirm dialog service
   */
  function RoutesService($q, $log, modelManager, notificationsService, confirmDialog) {
    this.$q = $q;
    this.$log = $log;
    this.routesModel = modelManager.retrieve('cloud-foundry.model.route');
    this.notificationsService = notificationsService;
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

      var host = routeEntity.host ? routeEntity.host + '.' : '';
      var port = routeEntity.port ? ':' + routeEntity.port : '';

      return host + domainName + port + routeEntity.path;
    },

    /**
     * @function unmapRoute
     * @description Unmap route from application
     * @param {string} cnsiGuid the cnsi guid of the HCF cluster
     * @param {object} route route metadata
     * @param {string} routeGuid route guid
     * @param {string} appGuid the app guid to unmap this route from
     * @returns {promise} promise once execution completed. Returns count of successful unmaps. If rejected this could
     * mean confirm dialog was cancelled OR unmap failed
     */
    unmapAppRoute: function (cnsiGuid, route, routeGuid, appGuid) {
      var that = this;
      var deferred = this.$q.defer();

      this.confirmDialog({
        title: gettext('Unmap Route from Application'),
        description: gettext('Are you sure you want to unmap ') + this.getRouteId(route) + '?',
        submitCommit: true,
        buttonText: {
          yes: gettext('Unmap'),
          no: gettext('Cancel')
        },
        errorMessage: gettext('There was a problem detaching this route. Please try again. If this error persists, please contact the Administrator.'),
        callback: function () {
          return that.routesModel.removeAppFromRoute(cnsiGuid, routeGuid, appGuid)
            .then(function () {
              that.notificationsService.notify('success', gettext('Route successfully unmapped'));
              deferred.resolve(1);
            })
            .catch(function (error) {
              // Deferred required for this error case (failure to execute callback)
              deferred.reject(error);
            });
        }
      }).result.catch(function () {
        deferred.reject();
        return that.$q.reject();
      });

      return deferred.promise;
    },

    /**
     * @function unmapRoutes
     * @description Unmap route from applications
     * @param {string} cnsiGuid the cnsi guid of the HCF cluster
     * @param {object} route route metadata
     * @param {string} routeGuid route guid
     * @param {Array} appGuids array of application guids to unmap
     * @returns {promise} promise once execution completed. Returns count of successful unmaps. If rejected this could
     * mean confirm dialog was cancelled or ALL apps failed to unmap
     */
    unmapAppsRoute: function (cnsiGuid, route, routeGuid, appGuids) {
      var that = this;

      var deferred = this.$q.defer();

      var dialog = this.confirmDialog({
        title: gettext('Unmap Route from Applications'),
        description: gettext('Are you sure you want to unmap ') + this.getRouteId(route) + '?',
        errorMessage: gettext('There was a problem detaching this route. Please try again. If this error persists, please contact the Administrator.'),
        submitCommit: true,
        buttonText: {
          yes: gettext('Unmap'),
          no: gettext('Cancel')
        },
        callback: function () {
          var promises = [];
          var failures = 0;
          _.forEach(appGuids, function (appGuid) {
            var promise = that.routesModel.removeAppFromRoute(cnsiGuid, routeGuid, appGuid).catch(function () {
              // Semi-swallow error. This allows $q.all to resolve once all requests have completed, not reject on first
              // request to reject
              failures++;
            });
            promises.push(promise);
          });
          return that.$q.all(promises)
            .then(function () {
              if (failures > 0) {
                that.notificationsService.notify('warning', gettext('Some applications failed to unmap from route'));
              } else {
                that.notificationsService.notify('success', gettext('Route successfully unmapped'));
              }
              deferred.resolve(appGuids.length - failures);
            }).catch(function (error) {
              deferred.reject(error);
              return that.$q.reject();
            });
        }
      });
      return dialog.result.catch(function () {
        deferred.reject();
        return that.$q.reject();
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
      var deferred = this.$q.defer();

      var dialog = this.confirmDialog({
        title: gettext('Delete Route'),
        description: gettext('Are you sure you want to delete ') + this.getRouteId(route) + '?',
        errorMessage: gettext('There was a problem detaching this route. Please try again. If this error persists, please contact the Administrator.'),
        submitCommit: true,
        buttonText: {
          yes: gettext('Delete'),
          no: gettext('Cancel')
        },
        callback: function () {
          return that.routesModel.deleteRoute(cnsiGuid, routeGuid, {
            recursive: true,
            async: false
          })
          .then(function () {
            that.notificationsService.notify('success', gettext('Route successfully deleted'));
            deferred.resolve();
          })
          .catch(function (error) {
            // Deferred is only required for this error case (failure to execute callback).
            deferred.reject(error);
            // Also swallow error in rejected promise (most likely a failed http response) to ensure default error msg
            // is used
            return that.$q.reject();
          });
        }
      });
      return dialog.result.catch(function () {
        deferred.reject();
        return that.$q.reject();
      });
    }
  });

})();
