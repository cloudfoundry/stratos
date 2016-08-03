(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-pipeline')
    .factory('cloud-foundry.view.applications.application.delivery-pipeline.hceSelect', hceSelectFactory)
    .controller('HceSelectController', HceSelectController);

  hceSelectFactory.$inject = [
    'helion.framework.widgets.detailView'
  ];

  /**
   * @function hceSelectFactory
   * @memberOf cloud-foundry.view.applications.application.delivery-pipeline
   * @description HCE Selection modal dialog factory
   * @param {helion.framework.widgets.detailView} detailView - the detail view service
   * @constructor
   */
  function hceSelectFactory(detailView) {
    return {
      show: function (hceCnsis) {

        return detailView(
          {
            controller: HceSelectController,
            controllerAs: 'HceSelectCtrl',
            detailViewTemplateUrl: 'plugins/cloud-foundry/view/applications/workflows/' +
            'add-app-workflow/pipeline-subflow/hce-select/hce-select.html'
          },
          {
            hceCnsis: hceCnsis
          }
        );
      }
    };
  }

  HceSelectController.$inject = [
    '$uibModalInstance',
    'context'
  ];

  /**
   * @function HceSelectController
   * @memberOf cloud-foundry.view.applications.application.delivery-pipeline
   * @description Controller for the HCE Selection dialog
   * @param {Object} $uibModalInstance - the Angular UI Bootstrap $uibModalInstance service
   * @param {Object} context - the uibModal context
   * @constructor
   */
  function HceSelectController($uibModalInstance, context) {

    var that = this;
    that.$uibModalInstance = $uibModalInstance;
    that.context = context;

    this.hceCnsi = null;
    this.selectionChanged = function (hceCnsi) {
      that.selected = hceCnsi;
    };

  }

  angular.extend(HceSelectController.prototype, {

    /**
     * @function getEndpoint
     * @memberOf cloud-foundry.view.applications.application.delivery-pipeline
     * @description get URL of selected HCE instance
     * @param {object} hceCnsi HCE CNSI information
     * @returns {string}
     */
    getEndpoint: function (hceCnsi) {
      return hceCnsi.api_endpoint.Scheme + '://' + hceCnsi.api_endpoint.Host;
    },

    /**
     * @function getName
     * @memberOf cloud-foundry.view.applications.application.delivery-pipeline
     * @description get name of selected HCE instance
     * @param {object} hceCnsi HCE CNSI information
     * @returns {string}
     */
    getName: function (hceCnsi) {
      return hceCnsi.name;
    },

    /**
     * @function selectHce
     * @memberOf cloud-foundry.view.applications.application.delivery-pipeline
     * @description Closes the dialog and resolve the `result`
     * promise with the selected HCE CNSI
     */
    selectHce: function () {
      this.$uibModalInstance.close(this.hceCnsi);
    },

    /**
     * @function cancel
     * @memberOf cloud-foundry.view.applications.application.delivery-pipeline
     * @description dimiss dialog
     */
    cancel: function () {
      this.$uibModalInstance.dismiss();
    }
  });

})();
