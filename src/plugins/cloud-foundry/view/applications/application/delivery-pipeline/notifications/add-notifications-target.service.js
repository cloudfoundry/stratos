(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-pipeline')
    .factory('cloud-foundry.view.applications.application.delivery-pipeline.addNotificationService', AddNotificationTargetServiceFactory)
    .controller('cloud-foundry.view.applications.application.delivery-pipeline.addNotificationTargetController', AddNotificationTargetController);

  AddNotificationTargetServiceFactory.$inject = [
    'helion.framework.widgets.detailView'
  ];

  function AddNotificationTargetServiceFactory(detailView) {

    return {
      add: function () {
        return detailView(
          {
            controller: AddNotificationTargetController,
            controllerAs: 'addNotificationTargetCtrl',
            detailViewTemplateUrl: 'plugins/cloud-foundry/view/applications/' +
            'application/delivery-pipeline/notifications/add-notification-target.html'
          },
          {}
        );
      }
    };
  }

  AddNotificationTargetController.$inject = [
    'modelManager',
    'apiManager',
    '$q',
    '$uibModalInstance'
  ];

  /**
   * @memberof cloud-foundry.view.applications.application.delivery-pipeline
   * @name AddNotificationTargetController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.api.apiManager} apiManager - the API management service
   * @param {object} $q - angular $q service
   * @param {object} $uibModalInstance - Bootstrap $uibModalService
   * @constructor
   */
  function AddNotificationTargetController(modelManager, apiManager, $q, $uibModalInstance) {
    var that = this;

    this.$q = $q;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.hceNotificationApi = apiManager.retrieve('cloud-foundry.api.HceNotificationApi');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.project = this.model.application.project;
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.$uibModalInstance = $uibModalInstance;
    this.hceCnsi = that.model.application.pipeline.hceCnsi;
    this.indications = {
      busy: false,
      error: false
    };

    this.userInput = {
      notificationTargetType: null,
      notificationTargetDetails: {
        name: null,
        location: null,
        token: null
      }
    };

    this.workflow = {
      allowJump: false,
      allowBack: true,
      title: 'Select Notification Target',
      btnText: {
        cancel: 'Close'
      },
      hideStepNavStack: false,
      steps: [
        {
          title: 'Select Notification',
          formName: 'form1',
          templateUrl: 'plugins/cloud-foundry/view/applications/application/' +
          'notification-targets/notification-target-list.html',
          nextBtnText: 'Next',
          cancelBtnText: 'Cancel'
        },
        {
          title: 'Notification Details',
          formName: 'form2',
          nextBtnText: 'Add Notification',
          templateUrl: 'plugins/cloud-foundry/view/applications/application/' +
          'delivery-pipeline/notifications/templates/step2.html',
          stepCommit: true,
          isLastStep: true
        }
      ]
    };

    this.actions = {

      /**
       * @function stop
       * @description Stop the add notification workflow
       */
      stop: function () {
        that.$uibModalInstance.dismiss();
      },

      /**
       * @function finish
       * @description Complete the add notification workflow
       * @returns {promise}
       */
      finish: function () {
        that.indications.busy = true;
        var request = that.userInput.notificationTargetDetails;
        request.type = that.userInput.notificationTargetType.item_value;

        return that.hceNotificationApi.addNotificationTarget(that.hceCnsi.guid,
          request, {project_id: that.project.id}, that.hceModel.hceProxyPassthroughConfig)
          .then(function (response) {
            that.indications.busy = false;
            that.$uibModalInstance.close(response.data);
          }).catch(function () {
            that.indications.busy = false;
            that.indications.error = true;
          });
      }
    };

    this.options = {
      workflow: that.workflow,
      userInput: that.userInput,
      notificationTargetTypes: that.hceModel.data.notificationTargetTypes,
      indications: that.indications
    };
  }

})();
