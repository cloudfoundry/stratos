(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-logs')
    .controller('eventDetailViewController', EventDetailViewController);

  EventDetailViewController.$inject = [
    'context',
    'content',
    'moment',
    'app.model.modelManager'
  ];

  /**
   * @name EventDetailViewController
   * @constructor
   * @param {object} context -
   * @param {object} content -
   * @param {object} moment - the moment timezone component
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {object} context -
   * @property {object} content -
   * @property {string} duration - The duration of the event
   */
  function EventDetailViewController(context, content, moment, modelManager) {
    var vm = this;
    vm.context = context;
    vm.content = content;
    vm.log = null;

    var event = vm.context.event;

    var hceModel = modelManager.retrieve('cloud-foundry.model.hce');

    hceModel.downloadArtifact(event.artifactId)
      .then(function(artifact) {
        if (artifact) {
          vm.log = artifact;
        } else {
          vm.log = false;
        }
      })
      .catch(function(error) {
        console.error('Failed to download artifact with id: ' + event.artifactId, error);
      })
      .finally(function() {
        if (!vm.log) {
          vm.log = false;
        }
      });

    // The design shows this as a human readible but vague 'a few seconds' ago. Moment humanize matches this.
    // Need to loop back and understand the requirement (only show this for a few seconds/show something more accurate
    // for longer durations/etc)
    vm.duration = moment.duration(event.startDate.diff(event.endDate)).humanize();
  }

})();
