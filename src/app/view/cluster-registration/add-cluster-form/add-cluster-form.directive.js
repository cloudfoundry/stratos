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
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.AddClusterFormController
   * @memberof app.view
   * @name AddClusterFormController
   * @constructor
   * @param {app.model.modelManager} - the application model manager
   * @property {app.model.serviceInstance} - the service instance model
   * @property {string} url - the cluster endpoint
   * @property {string} name - the cluster friendly name
   * @property {boolean} addClusterError - flag error adding cluster
   */
  function AddClusterFormController(modelManager) {
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.url = null;
    this.name = null;
    this.addClusterError = false;
  }

  angular.extend(AddClusterFormController.prototype, {
    /**
     * @function addCluster
     * @memberof app.view.AddClusterFormController
     * @description Add a cluster and dismiss this form after clearing it
     * @returns {void}
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
     * @returns {void}
     */
    cancel: function () {
      this.clearForm();
      this.onCancel();
    },

    /**
     * @function clearForm
     * @memberof app.view.AddClusterFormController
     * @description Clear the form and all errors
     * @returns {void}
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
     * @returns {void}
     */
    onAddClusterError: function () {
      this.addClusterError = true;
    }
  });

})();
