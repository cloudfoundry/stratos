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

      setWatchers: function () {
        var that = this;

        this.$scope.$watch(function () {
          return that.userInput.repoFilterTerm;
        }, function (newFilterTerm) {
          if (that.filterTimeout !== null) {
            that.$timeout.cancel(that.filterTimeout);
          }

          that.filterTimeout = that.$timeout(function () {
            return that.filterRepos(newFilterTerm);
          }, 500);
        });
      },

      getWorkflowDefinition: function () {
        var path = 'plugins/cloud-foundry/view/applications/workflows/add-pipeline-workflow/';
        var that = this;

        return {
          allowJump: false,
          allowBack: false,
          title: gettext('Add Pipeline'),
          btnText: {
            cancel: gettext('Cancel')
          },
          steps: [
            {
              ready: true,
              title: gettext('Select Source'),
              templateUrl: path + 'select-source.html',
              formName: 'application-source-form',
              nextBtnText: gettext('Next'),
              onNext: function () {
                var oauth;
                if (that.userInput.source.vcs_type === 'GITHUB') {
                  oauth = that.githubOauthService.start();
                } else {
                  oauth = that.$q.defer();
                  oauth.resolve();
                  oauth = oauth.promise;
                }

                return oauth
                  .then(function () {
                    return that.getRepos();
                  });
              }
            },
            {
              ready: true,
              title: gettext('Select Repository'),
              templateUrl: path + 'select-repository.html',
              formName: 'application-repo-form',
              nextBtnText: gettext('Next'),
              onNext: function () {
                that.getPipelineDetailsData();
                var githubModel = that.modelManager.retrieve('cloud-foundry.model.github');
                var hceModel = that.modelManager.retrieve('cloud-foundry.model.hce');

                if (that.userInput.repo) {
                  hceModel.getProjects(that.userInput.hceCnsi.guid).then(function (projects) {
                    var usedBranches = _.chain(projects)
                                        .filter(function (p) {
                                          return p.repo.full_name === that.userInput.repo.full_name;
                                        })
                                        .map(function (p) { return p.repo.branch; })
                                        .value();

                    return githubModel.branches(that.userInput.repo.full_name)
                      .then(function () {
                        var branches = _.map(githubModel.data.branches,
                                            function (o) {
                                              var used = _.indexOf(usedBranches, o.name) >= 0;
                                              return {
                                                disabled: used,
                                                label: o.name + (used ? gettext(' (used by other project)') : ''),
                                                value: o.name
                                              };
                                            });
                        [].push.apply(that.options.branches, branches);
                      });
                  });
                }
              }
            },
            {
              ready: true,
              title: gettext('Pipeline Details'),
              templateUrl: path + 'pipeline-details.html',
              formName: 'application-pipeline-details-form',
              nextBtnText: gettext('Create pipeline'),
              onNext: function () {
                var hceModel = that.modelManager.retrieve('cloud-foundry.model.hce');

                return hceModel.getDeploymentTargets(that.userInput.hceCnsi.guid).then(function () {
                  var name = that._getDeploymentTargetName();
                  var target = _.find(hceModel.data.deploymentTargets, {name: name});
                  if (target) {
                    return that.createPipeline(target.deployment_target_id)
                      .then(function (response) {
                        that.userInput.projectId = response.data.id;
                      });
                  } else {
                    return that.createDeploymentTarget().then(function (newTarget) {
                      return that.createPipeline(newTarget.deployment_target_id)
                        .then(function (response) {
                          that.userInput.projectId = response.data.id;
                        });
                    });
                  }
                });
              }
            },
            {
              ready: true,
              title: gettext('Notifications'),
              templateUrl: 'plugins/cloud-foundry/view/applications/application/' +
              'notification-targets/notification-target-list.html',
              formName: 'application-pipeline-notification-form',
              nextBtnText: gettext('Next'),
              onEnter: function () {
                var hceModel = that.modelManager.retrieve('cloud-foundry.model.hce');

                return hceModel.listNotificationTargetTypes(that.userInput.hceCnsi.guid)
                  .then(function () {
                    that.options.notificationTargetTypes = hceModel.data.notificationTargetTypes;
                  }).then(function () {
                    // Fetch automatically associated notification targets (i.e. GitHub pull request)
                    return hceModel.getNotificationTargets(that.userInput.hceCnsi.guid, that.userInput.projectId)
                      .then(function (response) {
                        that.userInput.notificationTargets = response.data;
                      });
                  });
              }
            },
            {
              ready: true,
              title: gettext('Deploy App'),
              templateUrl: path + 'deploy.html',
              formName: 'application-pipeline-deploy-form',
              nextBtnText: gettext('Finished code change'),
              isLastStep: true
            }
          ]
        };
      },

      /**
       * @function selectOptionMapping
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description domain mapping function
       * @param {object} o - an object to map
       * @returns {object} select-option object
       */
      selectOptionMapping: function (o) {
        return {
          label: o.entity.name,
          value: o
        };
      },

      getHceInstances: function () {
        var that = this;
        var serviceInstanceModel = this.modelManager.retrieve('app.model.serviceInstance.user');

        serviceInstanceModel.list().then(function () {
          that.options.hceCnsis.length = 0;
          var hceCnsis = _.filter(serviceInstanceModel.serviceInstances, { cnsi_type: 'hce' }) || [];
          if (hceCnsis.length > 0) {
            [].push.apply(that.options.hceCnsis, hceCnsis);
            that.userInput.hceCnsi = hceCnsis[0];
          } else {
            that.redefineWorkflowWithoutHce();
          }
        });
      },

      getVcsInstances: function () {
        var that = this;
        var hceModel = this.modelManager.retrieve('cloud-foundry.model.hce');

        var vcsTypesPromise = hceModel.listVcsTypes(that.userInput.hceCnsi.guid);
        var vcsInstancesPromise = hceModel.getVcses(that.userInput.hceCnsi.guid);

        return that.$q.all([vcsTypesPromise, vcsInstancesPromise])
          .then(function () {
            var sources = _.map(hceModel.data.vcsInstances, function (o) {
              var vcsType = hceModel.data.vcsTypes[o.vcs_type];
              return {
                img: vcsType.icon_url,
                label: vcsType.vcs_type_label,
                description: vcsType.description,
                value: o
              };
            }) || [];
            if (sources.length > 0) {
              [].push.apply(that.options.sources, sources);
              that.userInput.source = sources[0].value;
            }
          });
      },

      getRepos: function () {
        var that = this;
        var githubModel = this.modelManager.retrieve('cloud-foundry.model.github');

        this.options.loadingRepos = true;
        return githubModel.repos()
          .then(function (response) {
            that.options.hasMoreRepos = angular.isDefined(response.links.next);
            [].push.apply(that.options.repos, response.repos);
          })
          .finally(function () {
            that.options.loadingRepos = false;
          });
      },

      loadMoreRepos: function () {
        var that = this;
        var githubModel = this.modelManager.retrieve('cloud-foundry.model.github');

        this.options.loadingRepos = true;
        return githubModel.nextRepos()
          .then(function (response) {
            that.options.hasMoreRepos = angular.isDefined(response.links.next);
            [].push.apply(that.options.repos, response.newRepos);
          })
          .finally(function () {
            that.options.loadingRepos = false;
          });
      },

      filterRepos: function (newFilterTerm) {
        var that = this;
        var githubModel = this.modelManager.retrieve('cloud-foundry.model.github');

        this.options.loadingRepos = true;
        return this.$q.when(githubModel.filterRepos(newFilterTerm))
          .then(function (response) {
            if (angular.isDefined(response)) {
              that.options.hasMoreRepos = angular.isDefined(response.links.next);
              [].push.apply(that.options.repos, response.newRepos);
            }
          }).finally(function () {
            that.options.loadingRepos = false;
          });
      },

      getPipelineDetailsData: function () {
        var that = this;
        var hceModel = this.modelManager.retrieve('cloud-foundry.model.hce');

        hceModel.getBuildContainers(this.userInput.hceCnsi.guid)
          .then(function () {
            var buildContainers = _.map(hceModel.data.buildContainers,
                                        function (o) { return { label: o.build_container_label, value: o }; });
            [].push.apply(that.options.buildContainers, buildContainers);
          });

        hceModel.getImageRegistries(this.userInput.hceCnsi.guid)
          .then(function () {
            var imageRegistries = _.map(hceModel.data.imageRegistries,
                                        function (o) { return { label: o.registry_label, value: o }; });
            [].push.apply(that.options.imageRegistries, imageRegistries);
          });
      },

      /**
       * @function appendSubflow
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description append a sub workflow to the main workflow
       * @param {object} subflow - the sub workflow to append
       */
      appendSubflow: function (subflow) {
        this.data.workflow.steps.length = this.data.countMainWorkflowSteps;
        [].push.apply(this.data.workflow.steps, subflow);
      },

      createDeploymentTarget: function () {
        var hceModel = this.modelManager.retrieve('cloud-foundry.model.hce');
        var name = this._getDeploymentTargetName();
        var endpoint = this.userInput.serviceInstance.api_endpoint;
        var url = endpoint.Scheme + '://' + endpoint.Host;
        return hceModel.createDeploymentTarget(this.userInput.hceCnsi.guid, name,
                                               url,
                                               this.userInput.clusterUsername,
                                               this.userInput.clusterPassword,
                                               this.userInput.organization.entity.name,
                                               this.userInput.space.entity.name);
      },

      _getDeploymentTargetName: function () {
        return [
          this.userInput.serviceInstance.name,
          this.userInput.organization.entity.name,
          this.userInput.space.entity.name
        ].join('_');
      },

      createPipeline: function (targetId) {
        var hceModel = this.modelManager.retrieve('cloud-foundry.model.hce');
        return hceModel.createProject(this.userInput.hceCnsi.guid,
                                      this._createProjectName(),
                                      this.userInput.source,
                                      targetId,
                                      this.userInput.buildContainer.build_container_id,
                                      this.userInput.repo,
                                      this.userInput.branch);
      },

      /**
       * @function _createProjectName
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description create a project name
       * @returns {string} a unique object name
       * @private
       */
      _createProjectName: function () {
        var name = [
          this.userInput.name,
          this.userInput.application.summary.guid
        ].join('-');

        return name;
      },

      triggerPipeline: function () {
        var that = this;
        var githubModel = this.modelManager.retrieve('cloud-foundry.model.github');
        var hceModel = this.modelManager.retrieve('cloud-foundry.model.hce');

        githubModel.getBranch(this.userInput.repo.full_name, this.userInput.branch)
          .then(function (response) {
            var branch = response.data;
            hceModel.triggerPipelineExecution(that.userInput.hceCnsi.guid,
                                              that.userInput.projectId,
                                              branch.commit.sha);
          });
      },

      startWorkflow: function () {
        this.addingPipeline = true;
        this.reset();
        this.getHceInstances();
      },

      stopWorkflow: function () {
        this.addingPipeline = false;
      },

      finishWorkflow: function () {
        this.addingPipeline = false;
      }
    });

})();
