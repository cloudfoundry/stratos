(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.hceRegistration', HceRegistrationFactory);

  HceRegistrationFactory.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'helion.framework.widgets.detailView'
  ];

  function HceRegistrationFactory(modelManager, apiManager, detailView) {
    return {
      add: function () {
        var data = {name: '', url: ''};
        return detailView(
          {
            detailViewTemplateUrl: 'app/view/hce-registration/hce-registration.html',
            controller: HceRegistrationController,
            controllerAs: 'hceRegistrationCtrl',
            class: 'detail-view-thin'
          },
          {
            data: data
          }
        ).result;
      }
    };
  }

  HceRegistrationController.$inject = [
    '$scope',
    '$uibModalInstance',
    'app.model.modelManager',
    'app.view.notificationsService',
    'context'
  ];

  /**
   * @namespace app.view
   * @memberof app.view.hceRegistration
   * @name HceRegistrationController
   * @description Controller for HCE Registration detail view
   * @constructor
   * @param {object} $scope - angular $scope
   * @param {$uibModalInstance} $uibModalInstance - the UIB modal instance service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {object} context - context object
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   */
  function HceRegistrationController($scope, $uibModalInstance, modelManager, context, notificationsService) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.context = context;

    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceInstanceModel.list();

    this.serviceInstances = {};
    this.currentEndpoints = {};
    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
    this.notificationsService = notificationsService;

    var that = this;

    this.addHceError = false;
    this.context.options = {instances: []};

    $scope.$watchCollection(function () {
      return that.serviceInstanceModel.serviceInstances;
    }, function (serviceInstances) {
      var filteredInstances = _.filter(serviceInstances, {cnsi_type: 'hce'});
      _.forEach(filteredInstances, function (serviceInstance) {
        var guid = serviceInstance.guid;
        if (angular.isUndefined(that.serviceInstances[guid])) {
          that.serviceInstances[guid] = serviceInstance;
        } else {
          angular.extend(that.serviceInstances[guid], serviceInstance);
        }
      });

      that.context.options.instances = _.map(that.serviceInstances,
        function (c) {
          var endpoint = c.api_endpoint;
          return endpoint.Scheme + '://' + endpoint.Host;
        });
    });
  }

  angular.extend(HceRegistrationController.prototype, {
    /**
     * @function addCluster
     * @memberof app.view.AddClusterFormController
     * @description Add a cluster and dismiss this form after clearing it
     * @returns {promise} A promise object
     */
    addHce: function () {
      var that = this;
      return this.serviceInstanceModel.createHce(this.context.data.url, this.context.data.name)
        .then(function () {
          that.notificationsService.notify('success', gettext('HCE endpoint successfully registered'));
          that.$uibModalInstance.close();
        }, function () {
          that.onAddHceError();
        });
    },

    /**
     * @function onAddClusterError
     * @memberof app.view.AddClusterFormController
     * @description Display error when adding cluster
     * @returns {void}
     */
    onAddHceError: function () {
      this.addHceError = true;
    }
  });

})();
