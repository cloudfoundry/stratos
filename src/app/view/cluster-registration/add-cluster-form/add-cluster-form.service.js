(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.hcfRegistration', AddClusterFormFactory);

  AddClusterFormFactory.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'helion.framework.widgets.detailView'
  ];

  function AddClusterFormFactory(modelManager, apiManager, detailView) {

    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    this.serviceInstanceModel.list();
    return {
      add: function () {
        var data = {name: '', url: ''};
        return detailView(
          {
            detailViewTemplateUrl: 'app/view/cluster-registration/add-cluster-form/add-cluster-form.html',
            controller: AddClusterFormController,
            controllerAs: 'addClusterFormCtrl',
            class: 'detail-view-thin'
            // scope: {
            //   onCancel: onCancel,
            //   onSubmit: onSubmit
            // },
            // bindToController: true
          },
          {
            data: data
          }
        ).result;
      }
    };
  }

  AddClusterFormController.$inject = [
    '$scope',
    '$uibModalInstance',
    'app.model.modelManager',
    'app.view.notificationsService',
    'context'
  ];

  function AddClusterFormController($scope, $uibModalInstance, modelManager, notificationsService, context) {
    var that = this;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.$uibModalInstance = $uibModalInstance;
    this.notificationsService = notificationsService;
    this.url = null;
    this.name = null;
    this.context = context;
    this.addClusterError = false;
    this.existingApiEndpoints = [];

    $scope.$watch(function () {
      return that.serviceInstanceModel.serviceInstances;
    }, function (newCnsis) {
      that.existingApiEndpoints = _.map(newCnsis,
        function (c) {
          var endpoint = c.api_endpoint;
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
          that.notificationsService.notify('success', gettext('Cluster successfully registered'));
          that.clearForm();
          that.$uibModalInstance.close();
          // that.onSubmit();
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
      // this.onCancel();
      this.$uibModalInstance.dismiss();
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
