(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary')
    .factory('cloud-foundry.view.applications.application.summary.addRoutes', AddRouteServiceFactory);

  AddRouteServiceFactory.$inject = [
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @name AddRouteServiceFactory
   * @description Factory for getting the Add Route Dialog
   * @memberof cloud-foundry.view.applications.application.summary
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} asyncTaskDialog - async dialog service
   * @constructor
   */
  function AddRouteServiceFactory(modelManager, asyncTaskDialog) {

    this.routeModel = modelManager.retrieve('cloud-foundry.model.route');

    var that = this;

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

        var domains = [];
        var routeExists = false;
        var hideAsyncIndicatorContent = false;

        model.application.summary.available_domains.forEach(function (domain) {
          domains.push({
            label: domain.name,
            value: domain.guid
          });
        });
        var spaceGuid = model.application.summary.space_guid;
        var data = {
          host: null,
          port: null,
          path: null,
          space_guid: spaceGuid,
          domain_guid: domains[0].value
        };

        var addRoute = function (contextData) {

          hideAsyncIndicatorContent = false;
          routeExists = false;

          var data = {
            space_guid: contextData.space_guid,
            domain_guid: contextData.domain_guid,
            host: contextData.host
          };

          return that.routeModel.createRoute(cnsiGuid, data)
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
              throw error;
            });
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
            options: {
              domains: domains
            },
            routeExists: function () {
              return routeExists;
            },
            hideAsyncIndicatorContent: function () {
              return hideAsyncIndicatorContent;
            }
          },
          addRoute
        );
      }
    };
  }

})();
