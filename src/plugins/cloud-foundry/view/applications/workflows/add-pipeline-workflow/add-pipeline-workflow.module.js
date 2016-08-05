(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.workflows.add-pipeline-workflow', [])
    .constant('cloud-foundry.view.applications.workflows.add-pipeline-workflow.prototype', {
      init: function () {
        this.addingPipeline = false;
        var that = this;
        this.eventService.$on('cf.events.START_ADD_PIPELINE_WORKFLOW', function () {
          that.startWorkflow();
        });
      },

      startWorkflow: function () {
        this.addingPipeline = true;
      },

      stopWorkflow: function () {
        this.addingPipeline = false;
      },

      finishWorkflow: function () {
        this.addingPipeline = false;
      }
    });

})();
