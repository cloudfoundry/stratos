(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary')
    .factory('cfAddRoutes', AddRouteServiceFactory);

  /**
   * @name AddRouteServiceFactory
   * @description Factory for getting the Add Route Dialog
   * @memberof cloud-foundry.view.applications.application.summary
   * @param {object} $q - promise library
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} frameworkAsyncTaskDialog - async dialog service
   * @param {object} appClusterRoutesService - App cluster router service
   * @constructor
   */
  function AddRouteServiceFactory($q, modelManager, frameworkAsyncTaskDialog, appClusterRoutesService) {
    var that = this;
    this.routeModel = modelManager.retrieve('cloud-foundry.model.route');
    return {

      /**
       * @name add
       * @description Display Add Route Dialog
       * @param {String} cnsiGuid - CNSI GUID
       * @param {String} applicationId - Application GUID
       * @returns {*} frameworkAsyncTaskDialog
       */
      add: function (cnsiGuid, applicationId) {
        // Create a map of domain names -> domain guids
        var model = modelManager.retrieve('cloud-foundry.model.application');
        this.domainModel = modelManager.retrieve('cloud-foundry.model.shared-domain');
        this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');

        var domains = [];
        var routeExists = false;
        var hideAsyncIndicatorContent = false;

        model.application.summary.available_domains.forEach(function (domain) {
          domains.push({
            label: domain.name,
            value: domain.guid,
            type: undefined
          });
        });

        var spaceGuid = model.application.summary.space_guid;
        var data = {
          host: null,
          port: null,
          path: null,
          space_guid: spaceGuid,
          domain_guid: domains[0].value,
          useRandomPort: true,
          existingRoutes: null
        };

        // Either returns a function that creates a new route
        // or a function that returns an already existing route.
        var getAssignableRouteFunction = function (contextData) {
          if (contextData.activeTab === 0) {
            return that.routeModel.createRoute;
          } else {
            return function () {
              var route = _.find(contextData.existingRoutes, function (route) {
                return contextData.selectedExistingRoute.entity.id === route.entity.id;
              });

              return $q.when(route);
            };
          }
        };

        var addRoute = function (contextData, dialog) {

          hideAsyncIndicatorContent = false;
          routeExists = false;

          var data = {
            space_guid: contextData.space_guid,
            domain_guid: contextData.domain_guid,
            host: contextData.host,
            path: undefined
          };

          // Add support for random (generated port), port and path
          var params = {};
          var routeType = dialog.context.options.domainMap[data.domain_guid] ? dialog.context.options.domainMap[data.domain_guid].type : undefined;
          if (routeType === 'tcp') {
            if (contextData.useRandomPort) {
              params.generate_port = true;
            } else {
              data.port = contextData.port;
            }
          } else {
            if (contextData.path) {
              data.path = contextData.path;
              // Path must start with a forward slash, so check and add one in, if there isn't one already.
              if (data.path.indexOf('/') !== 0) {
                data.path = '/' + data.path;
              }
            }
          }

          var getRoute = getAssignableRouteFunction(contextData);

          return getRoute(cnsiGuid, data, params)
            .then(function (response) {
              if (!(response.metadata && response.metadata.guid)) {
                throw response;
              }
              var routeId = response.metadata.guid;
              return that.routeModel.associateAppWithRoute(cnsiGuid, routeId, applicationId);
            })

            .then(function () {
              // Update application summary model
              return model.getAppSummary(cnsiGuid, applicationId);
            })
            .catch(function (error) {
              // check if error is CF-RouteHostTaken indicating that the route has already been created
              if (_.isPlainObject(error) &&
                error.data.error_code &&
                error.data.error_code === 'CF-RouteHostTaken') {
                routeExists = true;
                hideAsyncIndicatorContent = true;
              }
              if (error.data.description) {
                dialog.context.errorMsg = error.data.description;
              }
              throw error;
            });
        };

        var options = {
          domains: domains,
          domainMap: _.mapKeys(domains, function (domain) { return domain.value; }),
          existingRoutes: [],
          userInput: {
            selectedExistingRoute: null
          },
          tableLimit: 4
        };

        var getAllRoutes = function (getRoutesFn, getRouteIdFn, applicationGuid) {
          // 1) Get all routes in current space.
          // 2) Filter out the one that the current application is already bound to.
          // 3) Get the route id and add it to the route object
          // 4) Return array of routes
          return getRoutesFn()
          .then(function (routes) {
            return _.chain(routes)
              .filter(function (route) {
                return !_.find(route.entity.apps, function (app) {
                  return app.metadata.guid === applicationGuid;
                });
              })
              .map(function (route) {
                route.entity.id = getRouteIdFn(route);
                return route;
              })
              .value();
          });
        };

        var getAllRoutesForThisSpace = _.partial(
          this.spaceModel.listAllRoutesForSpace,
          cnsiGuid,
          spaceGuid
        );

        var getReleventRoutes = _.partial(
          getAllRoutes,
          getAllRoutesForThisSpace,
          appClusterRoutesService.getRouteId,
          model.application.summary.guid
        );

        return frameworkAsyncTaskDialog(
          {
            title: 'app.app-info.app-tabs.summary.routes-panel.add-route-dialog.title',
            templateUrl: 'plugins/cloud-foundry/view/applications/application/summary/add-route/add-route.html',
            submitCommit: true,
            buttonTitles: {
              submit: 'app.app-info.app-tabs.summary.routes-panel.add-route-dialog.button.submit'
            },
            class: 'dialog-form-large',
            dialog: true
          },
          {
            data: data,
            options: options,
            routeExists: function () {
              return routeExists;
            },
            resetRouteExists: function () {
              routeExists = false;
            },
            hideAsyncIndicatorContent: function () {
              return hideAsyncIndicatorContent;
            },
            isType: function (routeType) {
              var type = options.domainMap[data.domain_guid] ? options.domainMap[data.domain_guid].type : undefined;
              return type === routeType;
            }
          },
          addRoute,
          function (contextData) {
            if (contextData.activeTab === 0) {
              return !(
                contextData.addRouteForm &&
                contextData.addRouteForm.$valid
              );
            } else {
              return !contextData.selectedExistingRoute;
            }
          },
          $q.all(
            this.domainModel.listAllSharedDomains(cnsiGuid).then(function (domainInfo) {
              return _.each(domainInfo, function (domain) {
                options.domainMap[domain.metadata.guid].type = options.domainMap[domain.metadata.guid] ? domain.entity.router_group_type || 'http' : 'http';
              });
            }),
            getReleventRoutes()
            .then(function (routes) {
              data.existingRoutes = routes;
            })
          )
        );
      }
    };
  }

})();
