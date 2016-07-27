(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-pipeline')
    .factory('cloud-foundry.view.applications.application.delivery-pipeline.addNotificationService', AddNotificationTargetServiceFactory);

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
    'app.model.modelManager',
    'app.api.apiManager',
    '$q',
    '$uibModalInstance'
  ];

  function AddNotificationTargetController(modelManager, apiManager, $q, $uibModalInstance) {
    var that = this;

    this.$q = $q;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.hceNotificationApi = apiManager.retrieve('cloud-foundry.api.HceNotificationApi');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.project = this.hceModel.getProject(this.model.application.summary.name);
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.$uibModalInstance = $uibModalInstance;
    this.hceCnsi = null;
    this.indications = {
      busy: false,
      error: false
    };
    this.cnsiModel.list().then(function () {
      var hceCnsis = _.filter(that.cnsiModel.serviceInstances, {cnsi_type: 'hce'}) || [];
      if (hceCnsis.length > 0) {
        /* eslint-disable */
        // FIXME: We are getting the first hce CNSI, this is implicitly assuming that we only have 1 HCE instance (TEAMFOUR-823)
        // This will break as more HCE instances are being added
        /* eslint-disable */
        that.hceCnsi = hceCnsis[0];
      }
    });

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
          'delivery-pipeline/notifications/templates/step1.html',
          nextBtnText: 'Next',
          cancelBtnText: 'Cancel'
        },
        {
          title: 'Notification Details',
          formName: 'form2',
          nextBtnText: 'Add Notification',
          templateUrl: 'plugins/cloud-foundry/view/applications/application/' +
          'delivery-pipeline/notifications/templates/step2.html',
          isLastStep: true
        }
      ]
    };

    this.actions = {
      stop: function () {
        that.$uibModalInstance.dismiss();
      },
      finish: function () {
        that.indications.busy = true;
        var request = that.userInput.notificationTargetDetails;
        request.type = that.userInput.notificationTargetType.item_value;

        return that.hceNotificationApi.addNotificationTarget(that.hceCnsi.guid,
          request, {project_id: that.project.id}, that.hceModel.hceProxyPassthroughConfig)
          .then(function () {
            that.indications.busy = false;
            that.$uibModalInstance.close();
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
