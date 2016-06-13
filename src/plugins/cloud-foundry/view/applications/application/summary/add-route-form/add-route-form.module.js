(function() {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary')
    .directive('addRouteForm', addRouteForm);

  addRouteForm.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace cloud-foundry.view.applications.application.summary.addRouteForm
   * @memberof cloud-foundry.view.applications.application.summary
   * @name addRouteForm
   * @description An add route form directive
   * @returns {object} The add-route-form directive definition object
   */
  function addRouteForm() {
    return {
      bindToController: {
        onCancel: '&',
        onSubmit: '&'
      },
      controller: AddRouteController,
      controllerAs: 'addRouteCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/summary/add-route-form/add-route-form.html'
    };
  }

  AddRouteController.$inject = [
    '$stateParams',
    'app.model.modelManager'

  ];

  /**
   * @namespace cloud-foundry.view.applications.application.summary.AddRouteController
   * @memberof cloud-foundry.view.applications.application.summary
   * @name AddRouteController
   * @constructor
   * @param {Object} $stateParams - the UI router $stateParams service
   * @param {app.api.modelManager} modelManager - the application model manager
   */
  function AddRouteController($stateParams, modelManager) {

    this.addRouteError = false;
    this.applicationId = $stateParams.guid;
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.routeModel = modelManager.retrieve('cloud-foundry.model.route');

    this.host = null;
    this.port = null;
    this.path = null;

    var domains = [];
    this.model.application.summary.available_domains.forEach(function(domain) {
      domains.push({
        label: domain.name,
        value: domain.guid
      });
    });

    this.domains = domains;
    this.domain_guid = domains[0].value;
  }

  function isUndefinedOrNull(val) {
    return angular.isUndefined(val) || val === null
  }

  angular.extend(AddRouteController.prototype, {
    /**
     * @function addRoute
     * @memberof cloud-foundry.view.applications.application.summary.AddRouteController
     * @description Add a route to an application
     */



    addRoute: function() {
      var that = this;

      var data = {
        space_guid: this.model.application.summary.space_guid,
        domain_guid: this.domain_guid,
        host: this.host
      };
      // Deal with optional fields
      if (!isUndefinedOrNull(this.port)) {
        data.port = this.port;
      }
      if (!isUndefinedOrNull(this.path)) {
        data.path = this.path;
      }
      this.routeModel.createRoute(this.cnsiGuid, data)
        .then(function(response) {
          console.log('Created route: ' + JSON.stringify(response));
          var routeId = response.metadata.guid;
          // var routeId = response.data[that.cnsiGuid].metadata.guid;
          return that.routeModel.associateAppWithRoute(that.cnsiGuid, routeId, that.applicationId);
      }).then(function() {
        // Update application summary model
        return that.model.getAppSummary(that.cnsiGuid, that.applicationId);
      }).then(function() {
        that.clearForm();
        that.onSubmit();
      }).catch(function() {
        that.onAddRouteError();
      });
    },

    /**
     * @function cancel
     * @memberof cloud-foundry.view.applications.application.summary.AddRouteController
     * @description Cancel adding a route. Clear the form and dismiss this form.
     */
    cancel: function() {
      this.clearForm();
      this.onCancel();
    }
    ,

    /**
     * @function clearForm
     * @memberof cloud-foundry.view.applications.application.summary.AddRouteController
     * @description Clear the form and all errors
     */
    clearForm: function() {
      this.host = null;
      this.path = null;
      this.port = null;
      this.addRouteError = false;
    }
    ,

    /**
     * @function addRouteError
     * @memberof cloud-foundry.view.applications.application.summary.AddRouteController
     * @description Display error when adding a route
     */
    onAddRouteError: function() {
      this.addRouteError = true;
    }
  });

})();
