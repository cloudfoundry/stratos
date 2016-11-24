(function () {
  'use strict';

  /**
   * @name cloud-foundry.view.applications.application.delivery-logs.triggerBuildDetailView
   * @description Service to trigger a build from a selection of recent commits
   **/
  angular
    .module('cloud-foundry.view.applications.application.delivery-logs')
    .factory('triggerBuildDetailView', triggerBuildDetailView);

  triggerBuildDetailView.$inject = [
    'helion.framework.widgets.detailView'
  ];

  function triggerBuildDetailView(detailView) {
    return {
      /**
       * @function open
       * @description Open a detail-view showing selection of commits that can be built against
       * @param {object} project - project to build
       * @param {string} cnsiGuid - cnsi to find the event log at
       * @returns {object} The resolved/rejected promise
       * @public
       **/
      open: function (project, cnsiGuid) {
        return detailView({
          templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/trigger-build/trigger-build.html',
          title: gettext('Select a Commit'),
          controller: TriggerBuildsDetailViewController
        }, {
          guid: cnsiGuid,
          project: project
        }).result;
      }
    };
  }

  TriggerBuildsDetailViewController.$inject = [
    '$timeout',
    '$uibModalInstance',
    '$q',
    'PAT_DELIMITER',
    'context',
    'content',
    'app.model.modelManager'
  ];

  /**
   * @name TriggerBuildsDetailViewController
   * @constructor
   * @param {object} $timeout - the angular timeout service
   * @param {object} $uibModalInstance - the modal object which is associated with this controller
   * @param {object} $q - the angular $q service
   * @param {string} PAT_DELIMITER - the PAT guid delimiter in project names
   * @param {object} context - parameter object passed in to DetailView
   * @param {object} content - configuration object passed in to DetailView
   * @param {app.model.modelManager} modelManager - the Model management service
   */
  function TriggerBuildsDetailViewController($timeout, $uibModalInstance, $q, PAT_DELIMITER, context, content, modelManager) {
    var that = this;
    that.context = context;
    that.content = content;
    that.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    that.githubModel = modelManager.retrieve('github.model');
    that.$uibModalInstance = $uibModalInstance;
    that.$timeout = $timeout;
    that.$q = $q;
    that.PAT_DELIMITER = PAT_DELIMITER;
    // TODO: remove this
    that.isAuthenticated = true;

    // Always initially attempt to fetch commits associated with this projects repo/branch
    that.fetchCommits();
  }

  angular.extend(TriggerBuildsDetailViewController.prototype, {

    build: function (skipUpdate) {
      var that = this;

      that.triggerError = false;
      that.triggering = true;

      return that.hceModel.triggerPipelineExecution(that.context.guid, that.context.project.id, that.selectedCommit.sha)
        .then(function () {
          // Success, cause successful promise for modal
          that.$uibModalInstance.close();
        })
        .catch(function () {
          if (skipUpdate) {
            that.triggerError = true;
          } else {
            that._updateAndBuild()
              .catch(function () {
                that.triggerError = true;
              })
              .finally(function () {
                that.triggering = false;
              });
          }
        });
    },

    _getPatGuid: function () {
      var projectName = this.context.project.name;
      if (!projectName) {
        return null;
      }
      var delimIndex = projectName.indexOf(this.PAT_DELIMITER);
      if (delimIndex < 0) {
        return null;
      }
      return projectName.slice(delimIndex + this.PAT_DELIMITER.length);

    },

    _updateAndBuild: function () {
      var that = this;

      var patGuid = this._getPatGuid();
      if (!patGuid) {
        return this.$q.reject('You must associate a valid PAT before triggering a build');
      }

      return this.hceModel.updateProject(this.context.guid, patGuid, this.context.project.id, this.context.project)
        .then(function () {
          return that.build(true);
        });
    },

    fetchCommits: function () {
      var that = this;
      this.fetching = true;

      var githubOptions = {
        headers: {
          'x-cnap-vcs-token-guid': this._getPatGuid()
        }
      };
      that.githubModel.commits(that.context.project.repo.full_name, that.context.project.repo.branch, 20, githubOptions)
        .then(function () {
          that.fetching = false;
          that.fetchError = false;
          that.permissionError = false;
          that.selectedCommit =
            _.get(that, 'githubModel.data.commits.length') ? that.githubModel.data.commits[0] : null;
        })
        .catch(function (response) {
          if (response.status === 401) {
            that.isAuthenticated = false;
          } else if (response.status === 404) {
            that.permissionError = true;
          } else {
            that.fetchError = true;
          }

          that.fetching = false;
        });
    },

    githubAuth: function () {
      // TODO: remove this
      this.isAuthenticated = true;
      this.fetchCommits();
    }
  });

})();
