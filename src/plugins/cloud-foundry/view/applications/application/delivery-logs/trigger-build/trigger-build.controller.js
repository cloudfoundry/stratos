(function() {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-logs')
    .controller('triggerBuildsDetailViewController', TriggerBuildsDetailViewController);

  TriggerBuildsDetailViewController.$inject = [
    '$timeout',
    '$uibModalInstance',
    'context',
    'content',
    'app.model.modelManager'
  ];

  /**
   * @name TriggerBuildsDetailViewController
   * @constructor
   * @param {object} $timeout - the angular timeout service
   * @param {object} $uibModalInstance - the modal object which is associated with this controller
   * @param {object} context - parameter object passed in to DetailView
   * @param {object} content - configuration object passed in to DetailView
   * @param {app.model.modelManager} modelManager - the Model management service
   */
  function TriggerBuildsDetailViewController($timeout, $uibModalInstance, context, content, modelManager) {
    var that = this;
    that.context = context;
    that.content = content;
    that.hasToken = false;
    that.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    that.githubModel = modelManager.retrieve('cloud-foundry.model.github');
    that.$uibModalInstance = $uibModalInstance;
    that.$timeout = $timeout;

    // Always initially attempt to fetch commits associated with this projects repo/branch
    that.fetchCommits();
  }

  angular.extend(TriggerBuildsDetailViewController.prototype, {

    build: function() {
      var that = this;

      that.triggerError = false;

      that.hceModel.triggerPipelineExecution(that.context.guid, that.context.project.id, that.selectedCommit.sha)
        .then(function() {
          // Success, cause successful promise for modal
          that.$uibModalInstance.close();
        })
        .catch(function() {
          that.triggerError = true;
        });
    },

    fetchCommits: function() {
      var that = this;

      this.hasToken = that.githubModel.getToken();
      if (!this.hasToken) {
        return;
      }

      that.fetchError = undefined;

      this.githubModel.commits(this.context.project.repo.full_name, this.context.project.repo.branch, 20)
        .then(function() {
          that.fetchError = false;
          that.selectedCommit = _.get(that, 'githubModel.data.commits.length') ? that.githubModel.data.commits[0] : null;
        })
        .catch(function() {
          that.fetchError = true;
        });
    }
  });
})();
