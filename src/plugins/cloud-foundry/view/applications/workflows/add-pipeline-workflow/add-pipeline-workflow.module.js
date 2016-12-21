(function () {
  'use strict';

  var PAT_DELIMITER = ';PAT:';

  angular
    .module('cloud-foundry.view.applications.workflows.add-pipeline-workflow', [])
    .constant('PAT_DELIMITER', PAT_DELIMITER)
    .constant('cloud-foundry.view.applications.workflows.add-pipeline-workflow.prototype', {

      init: function () {
        var that = this;
        this.addingPipeline = false;

        this.eventService.$on('cf.events.START_ADD_PIPELINE_WORKFLOW', function () {
          that.startWorkflow();
        });

        this.eventService.$on('cf.events.LOAD_MORE_REPOS', function () {
          that.loadMoreRepos();
        });

        this.setWatchers();
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

        this.$scope.$watch(function () {
          return that.userInput.clusterUsername;
        }, function (newUsername) {
          if (newUsername) {
            that._onClusterUsernameChanged();
          }
        });
      },

      setOptions: function () {
        var that = this;
        this.options = this.options || {};

        angular.extend(this.options, {
          workflow: this.data.workflow,
          userInput: this.userInput,
          errors: this.errors,
          apps: [],
          hceCnsis: [],
          notificationTargetTypes: [],
          notificationTargets: [],
          notificationTargetsReady: false,
          sources: [],
          displayedRepos: [],
          repos: [],
          hasMoreRepos: false,
          loadingRepos: false,
          repoStSearch: 'full_name',
          branches: [],
          buildContainers: [],
          notificationFormAppMode: true,
          imageRegistries: [],

          onManageTokens: function (vcs) {
            // Check that the selected source is still ok
            if (that.userInput.source) {
              if (that.userInput.source.guid === vcs.guid) {
                // Check that we're still selectable
                if (vcs.tokenOptions.length < 1) {
                  that.options.autoSelectSource();
                }
              }
            } else {
              // Try auto-select a source after manage tokens
              that.options.autoSelectSource();
            }
          },

          autoSelectSource: function () {

            // Preserve any existing selection if still valid
            if (that.userInput.source) {
              var reselect = _.find(that.options.sources, function (aSource) {
                return aSource.value.guid === that.userInput.source.guid;
              });

              // Check that the source still has valid tokens
              if (reselect && reselect.value.tokenOptions.length > 0) {
                that.userInput.source = reselect.value;
                return;
              }
              // If the existing selection is stale, carry on with the normal auto-selection logic
            }

            // Auto select the first source with valid tokens
            for (var i = 0; i < that.options.sources.length; i++) {
              var source = that.options.sources[i];
              if (source.value.tokenOptions.length > 0) {
                that.userInput.source = source.value;
                return;
              }
            }

            // Couldn't find suitable source, deselect
            delete that.userInput.source;
          },

          selectSource: function (vcs) {
            if (vcs.tokenOptions.length < 1) {
              return;
            }
            that.userInput.source = vcs;
          }
        });
      },

      getWorkflowDefinition: function () {
        var path = 'plugins/cloud-foundry/view/applications/workflows/add-pipeline-workflow/';
        var that = this;

        that.pipelineCreated = false;

        return {
          allowJump: false,
          allowBack: function () {
            return !that.pipelineCreated;
          },
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
              allowNext: function () {
                return !!that.options.userInput.source;
              },
              nextBtnText: gettext('Next'),
              onNextCancellable: true,
              showBusyOnEnter: gettext('Retrieving your VCS information'),
              onEnter: function () {
                return that.getVcsInstances();
              }
            },
            {
              ready: true,
              title: gettext('Select Repository'),
              templateUrl: path + 'select-repository.html',
              formName: 'application-repo-form',
              nextBtnText: gettext('Next'),
              showBusyOnEnter: gettext('Retrieving your repositories'),
              onEnter: function () {
                return that.getRepos().catch(function () {
                  var msg = gettext('There was a problem retrieving your repositories. Please try again.');
                  return that.$q.reject(msg);
                });
              }
            },
            {
              ready: true,
              title: gettext('Pipeline Details'),
              templateUrl: path + 'pipeline-details.html',
              formName: 'application-pipeline-details-form',
              nextBtnText: gettext('Create pipeline'),
              showBusyOnNext: gettext('Creating pipeline'),
              showBusyOnEnter: gettext("Retrieving the repository's branches"),
              onEnter: function () {
                that.options.repoStSearch = '';
                that.getPipelineDetailsData();
                var githubModel = that.modelManager.retrieve('github.model');
                var hceModel = that.modelManager.retrieve('cloud-foundry.model.hce');

                if (that.userInput.repo) {
                  return hceModel.getProjects(that.userInput.hceCnsi.guid).then(function (projects) {
                    var githubOptions = that._getVcsHeaders();
                    var usedBranches = _.chain(projects)
                      .filter(function (p) {
                        return p.repo.full_name === that.userInput.repo.full_name;
                      })
                      .map(function (p) { return p.repo.branch; })
                      .value();

                    return githubModel.branches(that.userInput.repo.full_name, githubOptions)
                      .then(function () {
                        var branches = _.map(githubModel.data.branches,
                          function (o) {
                            var used = _.indexOf(usedBranches, o.name) >= 0;
                            return {
                              disabled: used,
                              label: o.name + (used ? gettext(' (used by another project)') : ''),
                              value: o.name
                            };
                          });
                        [].push.apply(that.options.branches, branches);
                      })
                      .catch(function () {
                        var msg = gettext('There was a problem retrieving the branches for your repository. Please try again.');
                        return that.$q.reject(msg);
                      });
                  }).catch(function (msg) {
                    that.options.repoStSearch = 'full_name';
                    return that.$q.reject(msg);
                  });
                }
              },
              onNext: function () {
                var userServiceInstanceModel = that.modelManager.retrieve('app.model.serviceInstance.user');
                // First verify if provided credentials are correct
                return userServiceInstanceModel.verify(
                  that.userInput.serviceInstance.guid,
                  that.userInput.clusterUsername,
                  that.userInput.clusterPassword)
                  .then(function () {
                    // Successfully validated
                    if (that.options.deploymentTarget) {
                      return that.$q.when(that._updateDeploymentTarget(that.options.deploymentTarget))
                        .then(function () {
                          return that.createPipeline(that.options.deploymentTarget.deployment_target_id);
                        });
                    } else {
                      return that.createDeploymentTarget().then(function (newTarget) {
                        that.options.deploymentTarget = newTarget;
                        return that.createPipeline(newTarget.deployment_target_id);
                      });
                    }
                  }, function () {
                    // Failed to validate credentials
                    var msg = gettext('The username and password combination provided is invalid.');
                    return that.$q.reject(msg);
                  })
                  .then(function () {
                    // No longer allow going back after this point
                    that.pipelineCreated = true;
                  })
                  .catch(function (error) {
                    // Some other exception occurred

                    var message = gettext('There was a problem creating the pipeline.');

                    var codeEngineErrorDetails = that.utils.extractCodeEngineError(error);
                    if (codeEngineErrorDetails || _.isString(error)) {
                      message = gettext('Failed to create the pipeline due to following exception: ') + (codeEngineErrorDetails || error);
                    }
                    message = message + gettext(' Please try again. If problem persists, please contact your administrator. ');

                    return that.$q.reject(message);
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
                that.options.notificationTargetsReady = false;

                return hceModel.listNotificationTargetTypes(that.userInput.hceCnsi.guid)
                  .then(function () {
                    that.options.notificationTargetTypes = hceModel.data.notificationTargetTypes;

                    // Fetch automatically associated notification targets (i.e. GitHub pull request)
                    return hceModel.getNotificationTargets(that.userInput.hceCnsi.guid, that.userInput.projectId)
                      .then(function (response) {
                        that.userInput.notificationTargets = response.data;
                      });
                  })
                  .catch(function () {
                    that.options.notificationTargetsError = true;
                  })
                  .finally(function () {
                    that.options.notificationTargetsReady = true;
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

      redefineWorkflowWithoutHce: function () {},

      reset: function () {},

      /**
       * @function getSupportedVcsInstances
       * @memberof cloud-foundry.model.vcs.VcsModel
       * @description Returns metadata about the supported VCS Instances, given a list of all of the available instances
       * @param {object} hceVcsInstances - HCE VCS instance metadata from HCE
       * @returns {object} Metadata array with details of the set of supported VCS instances that can be presented to the user
       * @public
       */
      getSupportedVcsInstances: function (hceVcsInstances) {
        var that = this;
        var vcsModel = this.modelManager.retrieve('cloud-foundry.model.vcs');

        if (!hceVcsInstances || angular.isArray(hceVcsInstances) && _.isEmpty(hceVcsInstances)) {
          return this.$q.resolve([]);
        }

        var clientsP = vcsModel.listVcsClients();

        // List all tokens and check their validity
        var tokensP = vcsModel.listVcsTokens().then(function () {
          return vcsModel.checkTokensValidity();
        });

        return this.$q.all([clientsP, tokensP]).then(function () {
          // Filter clients that are not registered with this Code Engine
          var clientsInCodeEngine = _.filter(vcsModel.vcsClients, function (vcsClient) {
            return _.find(hceVcsInstances, function (hceVcs) {
              return vcsClient.browse_url === hceVcs.browse_url;
            });
          });

          return _.map(clientsInCodeEngine, function (vcs) {
            var source = vcsModel.getSupportedType(vcs);

            var hceVcs = _.find(hceVcsInstances, function (hceVcs) {
              return vcs.browse_url === hceVcs.browse_url;
            });

            vcsModel.buildTokenOptions(vcs);
            source.label = vcs.label;
            source.browse_url = vcs.browse_url;
            source.value = vcs;
            source.value.vcs_id = hceVcs.vcs_id;

            return source;
          });
        }, function () {
          var msg = gettext('There was a problem retrieving VCS instances. Please try again.');
          return that.$q.reject(msg);
        });
      },

      transferTokenSelections: function (newSources) {

        function getSourceFinder(oldSource) {
          return function (newSource) {
            return oldSource.value.guid === newSource.value.guid;
          };
        }

        for (var i = 0; i < this.options.sources.length; i++) {
          var oldSource = this.options.sources[i];
          if (oldSource.value.selectedToken) {
            var newSource = _.find(newSources, getSourceFinder(oldSource));
            if (newSource) {
              newSource.value.selectedToken = oldSource.value.selectedToken;
            }
          }
        }
      },

      getVcsInstances: function () {
        var that = this;
        var hceModel = this.modelManager.retrieve('cloud-foundry.model.hce');

        return hceModel.getVcses(that.userInput.hceCnsi.guid).then(function () {
          return that.getSupportedVcsInstances(hceModel.data.vcsInstances)
            .then(function (sources) {
              if (sources.length > 0) {

                // Need to preserve any Token selections
                that.transferTokenSelections(sources);

                that.options.sources.length = 0;
                [].push.apply(that.options.sources, sources);
                that.options.autoSelectSource();
              } else {
                var msg = gettext('No VCS instances were available for the selected delivery pipeline instance.');
                return that.$q.reject(msg);
              }
            });
        }).catch(function (error) {
          var message = gettext('There was a problem retrieving Code Engine VCS instances.');

          var codeEngineErrorDetails = that.utils.extractCodeEngineError(error);
          if (codeEngineErrorDetails || _.isString(error)) {
            message = gettext('Failed to retrieve Code Engine VCS instances due to following error: ') + (codeEngineErrorDetails || error);
          }
          message = message + gettext(' Please try again. If the problem persists, please contact your administrator.');

          return that.$q.reject(message);
        });

      },

      getRepos: function () {
        var that = this;
        var githubModel = this.modelManager.retrieve('github.model');
        var githubOptions = this._getVcsHeaders();

        this.options.loadingRepos = true;
        return githubModel.repos(false, githubOptions)
          .then(function (response) {
            that.options.repos.length = 0;

            that.options.hasMoreRepos = angular.isDefined(response.links.next);
            [].push.apply(that.options.repos, response.repos);
          })
          .finally(function () {
            that.options.loadingRepos = false;
          });
      },

      loadMoreRepos: function () {
        var that = this;
        var githubModel = this.modelManager.retrieve('github.model');
        var githubOptions = this._getVcsHeaders();

        this.options.loadingRepos = true;
        return githubModel.nextRepos(githubOptions)
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
        var githubModel = this.modelManager.retrieve('github.model');
        var githubOptions = this._getVcsHeaders();

        this.options.loadingRepos = true;
        return this.$q.when(githubModel.filterRepos(newFilterTerm, githubOptions))
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
        var endpoint = this.userInput.serviceInstance.api_endpoint;
        var url = endpoint.Scheme + '://' + endpoint.Host;
        var name = this._getDeploymentTargetName(url);
        return hceModel.createDeploymentTarget(this.userInput.hceCnsi.guid,
                                               name,
                                               url,
                                               this.userInput.clusterUsername,
                                               this.userInput.clusterPassword,
                                               this.userInput.organization.entity.name,
                                               this.userInput.space.entity.name);
      },

      _updateDeploymentTarget: function (target) {
        if (this.userInput.clusterPassword) {
          target.userName = this.userInput.clusterUsername;
          target.password = this.userInput.clusterPassword;

          return this.hceModel.updateDeploymentTarget(
            this.userInput.hceCnsi.guid,
            target.deployment_target_id,
            target);
        }
      },

      _getDeploymentTargetName: function (url) {
        return [
          url,
          this.userInput.organization.entity.name,
          this.userInput.space.entity.name,
          this.userInput.clusterUsername
        ].join(' - ');
      },

      _findDeploymentTarget: function (targets) {
        var endpoint = this.userInput.serviceInstance.api_endpoint;
        var url = endpoint.Scheme + '://' + endpoint.Host;
        var toMatch = {
          url: url,
          organization: this.userInput.organization.entity.name,
          space: this.userInput.space.entity.name,
          userName: this.userInput.clusterUsername
        };
        return _.find(targets, toMatch);
      },

      _getDeploymentTargets: function () {
        if (_.isNil(this.options.deploymentTargets)) {
          var that = this;
          return this.hceModel.getDeploymentTargets(this.userInput.hceCnsi.guid)
            .then(function () {
              that.options.deploymentTargets = that.hceModel.data.deploymentTargets;
            });
        }
      },

      _onClusterUsernameChanged: function () {
        var that = this;
        this.$q.when(this._getDeploymentTargets())
          .then(function () {
            that.options.deploymentTarget = that._findDeploymentTarget(that.options.deploymentTargets);
          });
      },

      createPipeline: function (targetId) {
        var that = this;
        return this.createProject(targetId).then(function () {
          return that.createCfBinding().catch(function () {
            return that.$q.when(that.deleteProject(that.userInput.projectId))
              .then(function () {
                that.userInput.projectId = null;
              })
              .finally(function () {
                var msg = gettext('There was a problem creating the pipeline binding.');
                return that.$q.reject(msg);
              });
          });
        }, function () {
          return that.utils.retryRequest(function () {
            return that.hceModel.getProjectByName(that.userInput.hceCnsi.guid, that.userInput.projectName);
          })
          .then(function (project) {
            if (project) {
              return that.deleteProject(project.id);
            }
          })
          .finally(function () {
            var msg = gettext('There was a problem creating the pipeline. Please ensure the webhook limit has not been reached on your repository.');
            return that.$q.reject(msg);
          });
        });
      },

      createProject: function (targetId) {
        if (this.userInput.projectId) {
          return this.$q.resolve();
        } else {
          var that = this;
          this.userInput.projectName = this._createProjectName();
          return this.hceModel.createProject(
            this.userInput.hceCnsi.guid,
            this.userInput.projectName,
            this.userInput.source,
            targetId,
            this.userInput.buildContainer.build_container_id,
            this.userInput.repo,
            this.userInput.branch,
            this.userInput.source.selectedToken
          ).then(function (response) {
            that.userInput.projectId = response.data.id;
          });
        }
      },

      deleteProject: function (projectId) {
        if (projectId) {
          return this.hceModel.removeProject(
            this.userInput.hceCnsi.guid,
            projectId
          );
        }
      },

      createCfBinding: function () {
        return this.hceModel.createCfBinding(
          this.userInput.hceCnsi.guid,
          this.userInput.projectId,
          this.userInput.application.summary.guid
        );
      },

      /**
       * @function _createProjectName
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description create a unique project name
       * @returns {string} a unique project name
       * @private
       */
      _createProjectName: function () {
        var name = [
          this.userInput.name,
          this.userInput.application.summary.guid
        ].join('-');

        name += PAT_DELIMITER + this.userInput.source.selectedToken;

        return name;
      },

      _getVcsHeaders: function () {
        var githubOptions = {};
        if (this.userInput.source) {
          githubOptions.headers = {
            'x-cnap-vcs-token-guid': _.get(this.userInput, 'source.selectedToken')
          };
        }

        return githubOptions;
      },

      startWorkflow: function () {
        this.addingPipeline = true;
        this.reset();
        this.getHceInstances();
      },

      stopWorkflow: function () {
        this.addingPipeline = false;
        this.closeDialog();
      },

      finishWorkflow: function () {
        this.addingPipeline = false;
        this.dismissDialog();
      }
    });

})();
