(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary')
    .factory('cloud-foundry.view.applications.application.summary.addRoutes', AddRouteServiceFactory);

  AddRouteServiceFactory.$inject = [
    '$timeout',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @name AddRouteServiceFactory
   * @description Factory for getting the Add Route Dialog
   * @memberof cloud-foundry.view.applications.application.summary
   * @param {function} $timeout - angular $timeout service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} asyncTaskDialog - async dialog service
   * @constructor
   */
  function AddRouteServiceFactory($timeout, modelManager, asyncTaskDialog) {
    var that = this;
    this.routeModel = modelManager.retrieve('cloud-foundry.model.route');
    return {

      /**
       * @name add
       * @description Display Add Route Dialog
       * @param {String} cnsiGuid - CNSI GUID
       * @param {String} applicationId - Application GUID
       * @returns {*} asyncTaskDialog
       */
      add: function (cnsiGuid, applicationId) {
        // Create a map of domain names -> domain guids
        var model = modelManager.retrieve('cloud-foundry.model.application');
        this.domainModel = modelManager.retrieve('cloud-foundry.model.shared-domain');

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
          useRandomPort: true
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

          return that.routeModel.createRoute(cnsiGuid, data, params)
            .then(function (response) {
              if (!(response.metadata && response.metadata.guid)) {
                /* eslint-disable no-throw-literal */
                throw response;
                /* eslint-enable no-throw-literal */
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
                error.error_code &&
                error.error_code === 'CF-RouteHostTaken') {
                routeExists = true;
                hideAsyncIndicatorContent = true;
              }
              if (error.description) {
                dialog.context.errorMsg = error.description;
              }
              throw error;
            });
        };

        var options = {
          domains: domains,
          domainMap: _.mapKeys(domains, function (domain) { return domain.value; })
        };

        return asyncTaskDialog(
          {
            title: gettext('Add a Route'),
            templateUrl: 'plugins/cloud-foundry/view/applications/' +
            'application/summary/add-route/add-route.html',
            buttonTitles: {
              submit: 'Create route'
            },
            class: 'detail-view-thin'
          },
          {
            data: data,
            options: options,
            routeExists: function () {
              return routeExists;
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
          undefined,
          this.domainModel.listAllSharedDomains(cnsiGuid).then(function (domainInfo) {
            _.each(domainInfo, function (domain) {
              options.domainMap[domain.metadata.guid].type = options.domainMap[domain.metadata.guid] ? domain.entity.router_group_type || 'http' : 'http';
            });
          })
        );
      }
    };
  }

})();
