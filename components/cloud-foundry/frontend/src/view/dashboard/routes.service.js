(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard')
    .factory('appClusterRoutesService', RoutesServiceFactory);

  function RoutesServiceFactory($q, $translate, modelManager, appNotificationsService, frameworkDialogConfirm) {
    return new appClusterRoutesService($q, $translate, modelManager, appNotificationsService, frameworkDialogConfirm);
  }

  /**
   * @name appClusterRoutesService
   * @constructor
   * @param {object} $q - the angular $log service
   * @param {object} $translate - the angular $translate service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.view.appNotificationsService} appNotificationsService - the toast notification service
   * @param {app.framework.widgets.dialog.frameworkDialogConfirm} frameworkDialogConfirm - the confirm dialog service
   */
  function appClusterRoutesService($q, $translate, modelManager, appNotificationsService, frameworkDialogConfirm) {

    return {
      getRouteId: getRouteId,
      unmapAppRoute: unmapAppRoute,
      unmapAppsRoute: unmapAppsRoute,
      deleteRoute: deleteRoute
    };

    /**
     * @function getRouteId
     * @description tracking function for routes
     * @param {object} route route or route entity
     * @returns {string} route ID
     */
    function getRouteId(route) {
      var routeEntity = _.get(route, 'entity', route);
      var domain = _.get(routeEntity, 'domain.entity', routeEntity.domain);
      var domainName = domain ? domain.name : $translate.instant('routes.unknown-domain');

      var host = routeEntity.host ? routeEntity.host + '.' : '';
      var port = routeEntity.port ? ':' + routeEntity.port : '';

      return host + domainName + port + routeEntity.path;
    }

    /**
     * @function unmapRoute
     * @description Unmap route from application
     * @param {string} cnsiGuid the cnsi guid of the CF cluster
     * @param {object} route route metadata
     * @param {string} routeGuid route guid
     * @param {string} appGuid the app guid to unmap this route from
     * @returns {object} promise once execution completed. Returns count of successful unmaps. If rejected this could
     * mean confirm dialog was cancelled OR unmap failed
     */
    function unmapAppRoute(cnsiGuid, route, routeGuid, appGuid) {
      var routesModel = modelManager.retrieve('cloud-foundry.model.route');
      var deferred = $q.defer();

      frameworkDialogConfirm({
        title: 'routes.unmap-app.title',
        description: $translate.instant('routes.unmap-app.description', { route: getRouteId(route) }),
        submitCommit: true,
        buttonText: {
          yes: 'routes.unmap-app.button-yes',
          no: 'buttons.cancel'
        },
        errorMessage: 'routes.unmap-app.error',
        callback: function () {
          return routesModel.removeAppFromRoute(cnsiGuid, routeGuid, appGuid)
            .then(function () {
              appNotificationsService.notify('success', $translate.instant('routes.unmap-app.success'));
              deferred.resolve(1);
            })
            .catch(function (error) {
              // Deferred required for this error case (failure to execute callback)
              deferred.reject(error);
            });
        }
      }).result.catch(function () {
        deferred.reject();
        return $q.reject();
      });

      return deferred.promise;
    }

    /**
     * @function unmapRoutes
     * @description Unmap route from applications
     * @param {string} cnsiGuid the cnsi guid of the CF cluster
     * @param {object} route route metadata
     * @param {string} routeGuid route guid
     * @param {Array} appGuids array of application guids to unmap
     * @returns {object} promise once execution completed. Returns count of successful unmaps. If rejected this could
     * mean confirm dialog was cancelled or ALL apps failed to unmap
     */
    function unmapAppsRoute(cnsiGuid, route, routeGuid, appGuids) {
      var routesModel = modelManager.retrieve('cloud-foundry.model.route');
      var deferred = $q.defer();

      var dialog = frameworkDialogConfirm({
        title: 'routes.unmap-apps.title',
        description: $translate.instant('routes.unmap-apps.description', { route: getRouteId(route) }),
        errorMessage: 'routes.unmap-apps.error',
        submitCommit: true,
        buttonText: {
          yes: 'routes.unmap-apps.button-yes',
          no: 'buttons.cancel'
        },
        callback: function () {
          var promises = [];
          var failures = 0;
          _.forEach(appGuids, function (appGuid) {
            var promise = routesModel.removeAppFromRoute(cnsiGuid, routeGuid, appGuid).catch(function () {
              // Semi-swallow error. This allows $q.all to resolve once all requests have completed, not reject on first
              // request to reject
              failures++;
            });
            promises.push(promise);
          });
          return $q.all(promises)
            .then(function () {
              if (failures > 0) {
                appNotificationsService.notify('warning', $translate.instant('routes.unmap-apps.partial-error'));
              } else {
                appNotificationsService.notify('success', $translate.instant('routes.unmap-apps.success'));
              }
              deferred.resolve(appGuids.length - failures);
            }).catch(function (error) {
              deferred.reject(error);
              return $q.reject();
            });
        }
      });
      return dialog.result.catch(function () {
        deferred.reject();
        return $q.reject();
      });
    }

    /**
     * @function deleteRoute
     * @description Unmap and delete route
     * @param {string} cnsiGuid the cnsi guid of the CF cluster
     * @param {object} route route metadata
     * @param {string} routeGuid route guid
     * @returns {object} promise once execution completed. This could mean confirm dialog was cancelled OR deleted
     * failed
     */
    function deleteRoute(cnsiGuid, route, routeGuid) {
      var routesModel = modelManager.retrieve('cloud-foundry.model.route');
      var deferred = $q.defer();

      var dialog = frameworkDialogConfirm({
        title: 'routes.delete.title',
        description: $translate.instant('routes.delete.description', { route: getRouteId(route) }),
        errorMessage: 'routes.delete.error',
        submitCommit: true,
        buttonText: {
          yes: 'routes.delete.button-yes',
          no: 'buttons.cancel'
        },
        callback: function () {
          return routesModel.deleteRoute(cnsiGuid, routeGuid, {
            recursive: true,
            async: false
          })
            .then(function () {
              appNotificationsService.notify('success', $translate.instant('routes.delete.success'));
              deferred.resolve();
            })
            .catch(function (error) {
              // Deferred is only required for this error case (failure to execute callback).
              deferred.reject(error);
              // Also swallow error in rejected promise (most likely a failed http response) to ensure default error msg
              // is used
              return $q.reject();
            });
        }
      });
      return dialog.result.catch(function () {
        deferred.reject();
        return $q.reject();
      });
    }
  }

})();
