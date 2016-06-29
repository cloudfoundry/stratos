(function() {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary')
    .factory('cloud-foundry.view.applications.application.summary.addRoutes', AddRouteServiceFactory)
    .controller('addRouteController', AddRouteController);

  AddRouteServiceFactory.$inject = [
    'app.model.modelManager',
    'helion.framework.widgets.detailView'
  ];

  function AddRouteServiceFactory(modelManager, detailView) {
    return {
      add: function() {
        var model = modelManager.retrieve('cloud-foundry.model.application');
        // Create a map of domain names -> domain guids
        var domains = [];
        model.application.summary.available_domains.forEach(function(domain) {
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
        return detailView(
          {
            controller: AddRouteController,
            controllerAs: 'addRouteCtrl',
            detailViewTemplateUrl: 'plugins/cloud-foundry/view/applications/' +
            'application/summary/add-route/add-route.html'
          },
          {
            data: data,
            options: {
              domains: domains
            }
          }
        ).result;
      }
    };
  }

  AddRouteController.$inject = [
    '$scope',
    '$stateParams',
    'app.model.modelManager',
    '$uibModalInstance',
    'context'
  ];

  /**
   * @name AddRouteController
   * @constructor
   * @param {Object} $scope
   * @param {Object} $stateParams - the UI router $stateParams service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {Object} $uibModalInstance - the Angular UI Bootstrap $uibModalInstance service
   * @param {Object} context - the uibModal context
   */
  function AddRouteController($scope, $stateParams, modelManager, $uibModalInstance, context) {
    var that = this;
    that.addRouteError = false;
    that.applicationId = $stateParams.guid;
    that.cnsiGuid = $stateParams.cnsiGuid;
    that.model = modelManager.retrieve('cloud-foundry.model.application');
    that.routeModel = modelManager.retrieve('cloud-foundry.model.route');
    that.uibModelInstance = $uibModalInstance;
    that.context = context;

    that.addRouteError = false;
    that.routeExists = false;

    $scope.$watch(function() {
      return that.context.data.host;
    }, function() {
      if (that.routeExists) {
        that.routeExists = false;
      }
    });
  }


  angular.extend(AddRouteController.prototype, {

    addRoute: function() {
      var that = this;
      var data = {
        space_guid: that.context.data.space_guid,
        domain_guid: that.context.data.domain_guid,
        host: that.context.data.host
      };

      this.routeModel.createRoute(that.cnsiGuid, data)
        .then(function(response) {
          if (!(response.metadata && response.metadata.guid)) {
            /* eslint-disable no-throw-literal */
            throw response;
            /* eslint-enable no-throw-literal */
          }
          var routeId = response.metadata.guid;
          return that.routeModel.associateAppWithRoute(that.cnsiGuid, routeId, that.applicationId);
        })

        .then(function() {
          // Update application summary model
          return that.model.getAppSummary(that.cnsiGuid, that.applicationId);
        })

        .then(function() {
          that.uibModelInstance.close();
        })

        .catch(function(error) {
          // check if error is CF-RouteHostTaken indicating that the route has already been created
          if (_.isPlainObject(error) &&
            error.error_code &&
            error.error_code === 'CF-RouteHostTaken') {
            that.routeExists = true;
            return;
          }
          that.onAddRouteError();
        });
    },

    /**
     * @function cancel
     * @description Cancel adding a route. Clear the form and dismiss this form.
     */
    cancel: function() {
      this.uibModelInstance.dismiss();
    },

    /**
     * @function onAddRouteError
     * @description Display error when adding a route
     */
    onAddRouteError: function() {
      this.addRouteError = true;
    }
  });

})();
