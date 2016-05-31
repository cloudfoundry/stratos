(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('addClusterForm', addClusterForm);

  addClusterForm.$inject = ['app.basePath'];

  /**
   * @namespace app.view.addClusterForm
   * @memberof app.view
   * @name addClusterForm
   * @description A directive to add clusters (ITOps) with a form
   * @param {string} path - the application base path
   * @example
   * <add-cluster-form on-cancel="ctrl.cancel()" on-submit="ctrl.submit()"></add-cluster-form>
   * @returns {object} The add-cluster-form directive definition object
   */
  function addClusterForm(path) {
    return {
      bindToController: {
        onCancel: '&',
        onSubmit: '&'
      },
      controller: AddClusterFormController,
      controllerAs: 'addClusterFormCtrl',
      scope: {},
      templateUrl: path + 'view/cluster-registration/add-cluster-form/add-cluster-form.html'
    };
  }

  AddClusterFormController.$inject = [
    '$scope',
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.AddClusterFormController
   * @memberof app.view
   * @name AddClusterFormController
   * @constructor
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.serviceInstance} serviceInstanceModel - the service instance model
   * @property {string} url - the cluster endpoint
   * @property {string} name - the cluster friendly name
   * @property {boolean} addClusterError - flag error adding cluster
   */
  function AddClusterFormController($scope, modelManager) {
    var that = this;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.url = null;
    this.name = null;
    this.addClusterError = false;
    this.existingApiEndpoints = [];

    $scope.$watch(function () {
      return that.serviceInstanceModel.serviceInstances;
    }, function (newCnsis) {
      that.existingApiEndpoints = _.map(newCnsis,
                                        function (c) {
                                          var endpoint = c.APIEndpoint;
                                          return endpoint.Scheme + '://' + endpoint.Host;
                                        });
    });
  }

  angular.extend(AddClusterFormController.prototype, {
    /**
     * @function addCluster
     * @memberof app.view.AddClusterFormController
     * @description Add a cluster and dismiss this form after clearing it
     */
    addCluster: function () {
      var that = this;
      this.serviceInstanceModel.create(this.url, this.name)
        .then(function () {
          that.clearForm();
          that.onSubmit();
        }, function () {
          that.onAddClusterError();
        });
    },

    /**
     * @function cancel
     * @memberof app.view.AddClusterFormController
     * @description Cancel adding cluster. Clear the form and dismiss this form.
     */
    cancel: function () {
      this.clearForm();
      this.onCancel();
    },

    /**
     * @function clearForm
     * @memberof app.view.AddClusterFormController
     * @description Clear the form and all errors
     */
    clearForm: function () {
      this.url = null;
      this.name = null;
      this.addClusterError = false;
    },

    /**
     * @function onAddClusterError
     * @memberof app.view.AddClusterFormController
     * @description Display error when adding cluster
     */
    onAddClusterError: function () {
      this.addClusterError = true;
    }
  });

})();
