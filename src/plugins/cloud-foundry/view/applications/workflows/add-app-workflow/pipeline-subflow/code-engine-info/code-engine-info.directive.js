(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-pipeline')
    .directive('codeEngineInfo', codeEngineInfo);

  codeEngineInfo.$inject = [];

  function codeEngineInfo() {
    return {
      bindToController: {
        hce: '=',
        hceCnsis: '='
      },
      controller: CodeEngineInfoController,
      controllerAs: 'codeEngineInfoCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/pipeline-subflow/code-engine-info/code-engine-info.html'
    };
  }

  CodeEngineInfoController.$inject = [
    'cloud-foundry.view.applications.application.delivery-pipeline.hceSelect'
  ];

  /**
   * @memberof cloud-foundry.view.applications.application.delivery-pipeline
   * @name CodeEngineInfoController
   * @description Shows details about the currently
   * selected HCE instance in the add-app-workflow
   * @constructor
   * @param {cloud-foundry.view.applications.application.delivery-pipeline.hceSelect} hceSelect  HCE Selection detail view service
   * @constructor
   */
  function CodeEngineInfoController(hceSelect) {

    this.hceSelect = hceSelect;
    // Select the first hce instance
    if (this.hceCnsis.length > 0) {
      this.hce = this.hceCnsis[0];
    }
  }

  angular.extend(CodeEngineInfoController.prototype, {

    /**
     * @function getName
     * @memberOf cloud-foundry.view.applications.application.delivery-pipeline
     * @description get name of selected HCE instance
     * @returns {string}
     */
    getName: function () {
      return this.hce.name;
    },

    /**
     * @function getEndpoint
     * @memberOf cloud-foundry.view.applications.application.delivery-pipeline
     * @description get URL of selected HCE instance
     * @returns {string}
     */
    getEndpoint: function () {
      return this.hce.api_endpoint.Scheme + '://' + this.hce.api_endpoint.Host;
    },

    /**
     * @function showHceEndpointForm
     * @memberOf cloud-foundry.view.applications.application.delivery-pipeline
     * @description Show HCE Selection modal
     */
    showHceEndpointForm: function () {
      var that = this;
      this.hceSelect.show(this.hceCnsis).result.then(function (selectedHce) {
        that.hce = selectedHce;
      });
    }

  });

})();
