(function () {
  'use strict';

  /* eslint-disable angular/no-private-call */

  describe('add-pipeline-workflow prototype', function () {
    var $httpBackend;
    var tokenGuid = '01234';

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      this.addPipelineWorkflowPrototype = $injector.get('cloud-foundry.view.applications.workflows.add-pipeline-workflow.prototype');

      function F() {
        this.modelManager = $injector.get('app.model.modelManager');
        this.eventService = $injector.get('app.event.eventService');
        this.$q = $injector.get('$q');
        this.utils = $injector.get('app.utils.utilsService');
        this.$scope = $injector.get('$rootScope').$new();
        this.$timeout = $injector.get('$timeout');
        this.userInput = {
          application: {
            summary: {
              guid: 'app-guid'
            }
          },
          organization: {
            entity: { name: 'organization' }
          },
          space: {
            entity: { name: 'space' }
          },
          clusterUsername: 'clusterUsername',
          clusterPassword: 'clusterPassword',
          serviceInstance: {
            api_endpoint: {
              Scheme: 'https',
              Host: 'foo.com'
            }
          },
          hceCnsi: {
            guid: 'hceCnsi guid'
          },
          repoFilterTerm: null,
          source: {
            browse_url: 'browse_url',
            token: {
              guid: tokenGuid
            },
            token_name: 'Token A'
          },
          buildContainer: {
            build_container_id: 'uild_container_id'
          },
          repo: {
            owner: {
              login: {}
            },
            full_name: 'repo_full_name'
          },
          projectId: 'projectId',
          branch: {}
        };
        this.options = {};
        this.cnsiGuid = 'cnsiGuid';
        this.hceModel = this.modelManager.retrieve('cloud-foundry.model.hce');
      }

      F.prototype = this.addPipelineWorkflowPrototype;

      this.instance = new F();
      this.instance.closeDialog = jasmine.createSpy();
      this.instance.dismissDialog = jasmine.createSpy();
      this.instance.data = {
        workflow: {}
      };
    }));

    afterEach(function () {
    });

    it('should be defined', function () {
      expect(this.addPipelineWorkflowPrototype).toBeDefined();
    });

    it('should define #init method', function () {
      spyOn(this.instance, 'setWatchers');
      this.instance.init();
      expect(this.instance.addingPipeline).toBe(false);
      expect(this.instance.setWatchers).toHaveBeenCalled();
    });

    describe('after initializing', function () {
      beforeEach(function () {
        $httpBackend.whenGET('/pp/v1/proxy/v2/deployments/targets').respond({ });
        $httpBackend.expectGET('/pp/v1/proxy/v2/deployments/targets');
        this.instance.init();
      });

      it('should listen cf.events.START_ADD_PIPELINE_WORKFLOW', function () {
        spyOn(this.instance, 'startWorkflow');
        this.instance.eventService.$emit('cf.events.START_ADD_PIPELINE_WORKFLOW');
        expect(this.instance.startWorkflow).toHaveBeenCalled();
      });

      it('should listen cf.events.LOAD_MORE_REPOS', function () {
        spyOn(this.instance, 'loadMoreRepos');
        this.instance.eventService.$emit('cf.events.LOAD_MORE_REPOS');
        expect(this.instance.loadMoreRepos).toHaveBeenCalled();
      });

      describe('#setOptions', function () {
        beforeEach(function () {
          this.instance.setOptions();
        });

        it('should define options', function () {
          expect(this.instance.options).toBeDefined();
        });

        it('#getHceInstances - no hce instances', function () {
          var that = this.instance;
          var serviceInstanceModel = that.modelManager.retrieve('app.model.serviceInstance.user');
          serviceInstanceModel.list = function () {
            return that.$q.resolve();
          };
          spyOn(serviceInstanceModel, 'list').and.callThrough();
          spyOn(that, 'redefineWorkflowWithoutHce');
          that.getHceInstances();
          that.$scope.$apply();
          expect(serviceInstanceModel.list).toHaveBeenCalled();
          expect(that.redefineWorkflowWithoutHce).toHaveBeenCalled();
        });

        it('#getHceInstances - has hce instances', function () {
          var that = this.instance;
          var serviceInstanceModel = that.modelManager.retrieve('app.model.serviceInstance.user');
          serviceInstanceModel.list = function () {
            serviceInstanceModel.serviceInstances = [{ cnsi_type: 'hcf' }, { cnsi_type: 'hce' }];
            return that.$q.resolve();
          };
          spyOn(serviceInstanceModel, 'list').and.callThrough();
          spyOn(that, 'redefineWorkflowWithoutHce');
          that.getHceInstances();
          that.$scope.$apply();
          expect(serviceInstanceModel.list).toHaveBeenCalled();
          expect(that.redefineWorkflowWithoutHce).not.toHaveBeenCalled();
        });

        it('#getVcsInstances - fail', function () {
          var that = this.instance;
          that.hceModel.getVcses = function () {
            return that.$q.reject({});
          };
          spyOn(that.hceModel, 'getVcses').and.callThrough();
          that.getVcsInstances();
          that.$scope.$apply();
          expect(that.hceModel.getVcses).toHaveBeenCalled();
        });

      });

      it('#setWatchers', function () {
        spyOn(this.instance, 'filterRepos');
        spyOn(this.instance, '_onClusterUsernameChanged');
        this.instance.setWatchers();
        this.instance.$scope.$apply();
        this.instance.$timeout.flush();
        expect(this.instance.filterRepos).toHaveBeenCalled();
        expect(this.instance._onClusterUsernameChanged).toHaveBeenCalled();
      });

      describe('#getWorkflowDefinition', function () {
        var workflowDefinition;
        beforeEach(function () {
          workflowDefinition = this.instance.getWorkflowDefinition();
        });

        it('should define workflowDefinition', function () {
          expect(workflowDefinition).toBeDefined();
        });
      });

      describe('Define workflow', function () {
        beforeEach(function () {
          this.instance.data = this.instance.data || {};
          this.instance.data.workflow = this.instance.getWorkflowDefinition();
          this.instance.userInput.source = {};
          $httpBackend.whenGET('/pp/v1/vcs/user/repos?per_page=50').respond({ });
          $httpBackend.expectGET('/pp/v1/vcs/user/repos?per_page=50');
        });

        it('should define workflow', function () {
          expect(this.instance.data.workflow).toBeDefined();
        });

        it('step 1 - onNext:GITHUB -> success -> failed', function () {
          var that = this.instance;
          var step = that.data.workflow.steps[0];
          that.userInput.source.vcs_type = 'GITHUB';
          that.getRepos = function () {
            return that.$q.reject();
          };
          var p = step.onNext();
          that.$scope.$apply();
          expect(p.$$state.status).toBe(2);
        });

        it('step 2 - onNext', function () {
          $httpBackend.whenGET('/pp/v1/proxy/v2/containers/build_containers').respond({ });
          $httpBackend.expectGET('/pp/v1/proxy/v2/containers/build_containers');
          $httpBackend.whenGET('/pp/v1/proxy/v2/containers/images/registries').respond({ });
          $httpBackend.expectGET('/pp/v1/proxy/v2/containers/images/registries');
          $httpBackend.whenGET('/pp/v1/vcs/user/repos?per_page=50').respond({ });
          $httpBackend.expectGET('/pp/v1/vcs/user/repos?per_page=50');
          $httpBackend.whenGET('/pp/v1/vcs/repos/undefined/branches?page=1&per_page=100').respond({ });
          $httpBackend.expectGET('/pp/v1/vcs/repos/undefined/branches?page=1&per_page=100');
          var that = this.instance;
          var githubModel = that.modelManager.retrieve('github.model');

          that.hceModel.getProjects = function () {
            return that.$q.resolve();
          };

          githubModel.branches = function () {
            return that.$q.resolve();
          };
          spyOn(that.hceModel, 'getProjects').and.callThrough();
          spyOn(githubModel, 'branches').and.callThrough();
          that.userInput.repo = {};
          var step = that.data.workflow.steps[1];
          that.options.branches = [{}];
          step.onNext();
          that.$scope.$apply();
          expect(that.hceModel.getProjects).toHaveBeenCalled();
          expect(githubModel.branches).toHaveBeenCalled();
        });

        it('step 3 - onNext - has deployment target', function () {
          $httpBackend.whenPUT('/pp/v1/proxy/v2/deployments/targets/undefined').respond({ });
          $httpBackend.expectPUT('/pp/v1/proxy/v2/deployments/targets/undefined');
          var that = this.instance;
          that.options.deploymentTarget = {};
          var userServiceInstanceModel = that.modelManager.retrieve('app.model.serviceInstance.user');
          userServiceInstanceModel.verify = function () {
            return that.$q.resolve();
          };
          that._updateDeploymentTarget = function () {
            return that.$q.resolve({
            });
          };
          that.createPipeline = function () {
            return that.$q.resolve({
            });
          };
          spyOn(userServiceInstanceModel, 'verify').and.callThrough();
          spyOn(that, '_updateDeploymentTarget').and.callThrough();
          spyOn(that, 'createPipeline').and.callThrough();
          that.userInput.repo = {};
          var step = that.data.workflow.steps[2];
          step.onNext();
          that.$scope.$apply();
          expect(userServiceInstanceModel.verify).toHaveBeenCalled();
          expect(that._updateDeploymentTarget).toHaveBeenCalled();
          expect(that.createPipeline).toHaveBeenCalled();
        });

        it('step 3 - onNext - no deployment tartget', function () {
          $httpBackend.whenPOST('/pp/v1/proxy/v2/projects/projectId/bindings/cloudfoundry').respond({ });
          $httpBackend.expectPOST('/pp/v1/proxy/v2/projects/projectId/bindings/cloudfoundry');
          var that = this.instance;
          var userServiceInstanceModel = that.modelManager.retrieve('app.model.serviceInstance.user');
          userServiceInstanceModel.verify = function () {
            return that.$q.resolve();
          };
          that.createDeploymentTarget = function () {
            return that.$q.resolve({
              newTarget: {}
            });
          };
          spyOn(userServiceInstanceModel, 'verify').and.callThrough();
          spyOn(that, 'createDeploymentTarget').and.callThrough();
          that.userInput.repo = {};
          var step = that.data.workflow.steps[2];
          step.onNext();
          that.$scope.$apply();
          expect(userServiceInstanceModel.verify).toHaveBeenCalled();
          expect(that.createDeploymentTarget).toHaveBeenCalled();
        });

        it('step 4 - onEnter', function () {
          $httpBackend.whenGET('/pp/v1/proxy/v2/notifications/targets?project_id=projectId').respond({ });
          $httpBackend.expectGET('/pp/v1/proxy/v2/notifications/targets?project_id=projectId');
          var that = this.instance;
          that.hceModel.listNotificationTargetTypes = function () {
            return that.$q.resolve({
            });
          };
          that.hceModel.getNotificationTargets = function () {
            return that.$q.resolve({
              data: 'foo'
            });
          };
          spyOn(that.hceModel, 'listNotificationTargetTypes').and.callThrough();
          spyOn(that.hceModel, 'getNotificationTargets').and.callThrough();
          var step = that.data.workflow.steps[3];
          step.onEnter();
          that.$scope.$apply();
          expect(that.hceModel.listNotificationTargetTypes).toHaveBeenCalled();
          expect(that.hceModel.getNotificationTargets).toHaveBeenCalled();
          expect(that.userInput.notificationTargets).toBe('foo');
        });
      });

      it('#selectOptionMapping', function () {
        var o = {
          entity: {
            name: 'some name'
          }
        };
        var map = this.instance.selectOptionMapping(o);
        expect(map.label).toBe('some name');
        expect(map.value).toBe(o);
      });

      it('#getRepos', function () {
        $httpBackend.whenGET('/pp/v1/vcs/user/repos?per_page=50').respond({ });
        $httpBackend.expectGET('/pp/v1/vcs/user/repos?per_page=50');
        var githubModel = this.instance.modelManager.retrieve('github.model');

        var d = this.instance.$q.defer();
        githubModel.repos = function () {
          d.resolve({
            links: {
              next: true
            },
            repos: []
          });
          return d.promise;
        };
        spyOn(githubModel, 'repos').and.callThrough();
        this.instance.options.repos = [];
        this.instance.getRepos();
        this.instance.$scope.$apply();
        expect(githubModel.repos).toHaveBeenCalled();
      });

      it('#loadMoreRepos', function () {
        $httpBackend.whenGET('/pp/v1/vcs/user/repos?per_page=50').respond({ });
        $httpBackend.expectGET('/pp/v1/vcs/user/repos?per_page=50');
        var githubModel = this.instance.modelManager.retrieve('github.model');
        var d = this.instance.$q.defer();
        githubModel.nextRepos = function () {
          d.resolve({
            links: {
              next: true
            },
            newRepos: []
          });
          return d.promise;
        };
        spyOn(githubModel, 'nextRepos').and.callThrough();
        this.instance.options.repos = [];
        this.instance.loadMoreRepos();
        this.instance.$scope.$apply();
        expect(githubModel.nextRepos).toHaveBeenCalled();
      });

      it('#filterRepos', function () {
        var that = this.instance;
        var githubModel = that.modelManager.retrieve('github.model');
        that.options.repos = [{}];
        githubModel.filterRepos = function () {
          return that.$q.resolve({
            newRepos: [{}],
            links: {
              next: {}
            }
          });
        };
        spyOn(githubModel, 'filterRepos').and.callThrough();
        that.filterRepos();
        that.$scope.$apply();
        expect(githubModel.filterRepos).toHaveBeenCalled();
        expect(that.options.repos.length).toBe(2);
      });

      it('#getPipelineDetailsData', function () {
        var d1 = this.instance.$q.defer();
        this.instance.hceModel.getBuildContainers = function () {
          d1.resolve();
          return d1.promise;
        };

        var d2 = this.instance.$q.defer();
        this.instance.hceModel.getImageRegistries = function () {
          d2.resolve();
          return d2.promise;
        };

        var d3 = this.instance.$q.defer();
        this.instance.hceModel._getDeploymentTargets = function () {
          d3.resolve();
          return d3.promise;
        };

        spyOn(this.instance.hceModel, 'getBuildContainers').and.callThrough();
        spyOn(this.instance.hceModel, 'getImageRegistries').and.callThrough();

        this.instance.options.buildContainers = [];
        this.instance.options.imageRegistries = [];
        this.instance.getPipelineDetailsData();
        this.instance.$scope.$apply();
        expect(this.instance.hceModel.getBuildContainers).toHaveBeenCalled();
        expect(this.instance.hceModel.getImageRegistries).toHaveBeenCalled();
      });

      it('#appendSubflow', function () {
        this.instance.data = {
          workflow: {
            steps: [{}]
          },
          countMainWorkflowSteps: 1
        };
        this.instance.appendSubflow([{}]);
        expect(this.instance.data.workflow.steps.length).toBe(2);
      });

      it('#createDeploymentTarget', function () {
        spyOn(this.instance.hceModel, 'createDeploymentTarget');
        this.instance.createDeploymentTarget();
        expect(this.instance.hceModel.createDeploymentTarget).toHaveBeenCalled();
      });

      it('#_updateDeploymentTarget', function () {
        spyOn(this.instance.hceModel, 'updateDeploymentTarget');
        this.instance._updateDeploymentTarget({});
        expect(this.instance.hceModel.updateDeploymentTarget).toHaveBeenCalled();
      });

      it('#_getDeploymentTargetName', function () {
        var name = this.instance._getDeploymentTargetName('url');
        expect(name).toBe('url - organization - space - clusterUsername');
      });

      it('#_findDeploymentTarget', function () {
        var p = this.instance._findDeploymentTarget([]);
        expect(p).toBeUndefined();
      });

      it('#_getDeploymentTargets', function () {
        var that = this.instance;
        that.hceModel.getDeploymentTargets = function () {
          return that.$q.resolve();
        };
        spyOn(that.hceModel, 'getDeploymentTargets').and.callThrough();
        that._getDeploymentTargets();
        that.$scope.$apply();
        expect(that.hceModel.getDeploymentTargets).toHaveBeenCalled();
      });

      it('#createProject', function () {
        var that = this.instance;
        that.userInput.projectId = 'projectId';
        expect(that.createProject('targetId').$$state.status).toBe(1);
        that.hceModel.createProject = function () {
          return that.$q.resolve({
            data: {
              id: 'foo'
            }
          });
        };
        spyOn(that.hceModel, 'createProject').and.callThrough();
        that.userInput.projectId = null;
        that.createProject('targetId');
        that.$scope.$apply();
        expect(that.hceModel.createProject).toHaveBeenCalled();
        expect(that.userInput.projectId).toBe('foo');
      });

      it('#deleteProject', function () {
        var p = this.instance.deleteProject('baz');
        expect(p.then).toBeDefined();
      });

      it('#createCfBinding', function () {
        this.instance.userInput.hceCnsi = 'foo';
        this.instance.userInput.projectId = 'baz';
        this.instance.userInput.application = {
          summary: {
            guid: 'bar'
          }
        };
        var p = this.instance.createCfBinding();
        expect(p.then).toBeDefined();
      });

      it('#_createProjectName', function () {
        this.instance.userInput.name = 'foo';
        this.instance.userInput.application = {
          summary: {
            guid: 'bar'
          }
        };
        var name = this.instance._createProjectName();
        expect(name).toBe('foo-bar;PAT:' + tokenGuid);
      });

      it('#_getVcsHeaders', function () {
        this.instance.userInput.source = {};
        var githubOptions = this.instance._getVcsHeaders();
        expect(githubOptions.headers).toBeDefined();
      });

      it('#startWorkflow', function () {
        spyOn(this.instance, 'reset').and.callThrough();
        spyOn(this.instance, 'getHceInstances');

        this.instance.startWorkflow();
        expect(this.instance.addingPipeline).toBe(true);
        expect(this.instance.reset).toHaveBeenCalled();
        expect(this.instance.getHceInstances).toHaveBeenCalled();
      });

      it('#stopWorkflow', function () {
        this.instance.stopWorkflow();
        expect(this.instance.addingPipeline).toBe(false);
        expect(this.instance.closeDialog).toHaveBeenCalled();
      });

      it('#finishWorkflow', function () {
        this.instance.finishWorkflow();
        expect(this.instance.addingPipeline).toBe(false);
        expect(this.instance.dismissDialog).toHaveBeenCalled();
      });
    });
  });

  /* eslint-enable angular/no-private-call */
})();
