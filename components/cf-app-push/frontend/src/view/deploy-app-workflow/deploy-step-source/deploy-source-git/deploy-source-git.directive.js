(function () {
  'use strict';

  angular
    .module('cf-app-push')
    .directive('appDeploySourceGit', DeploySourceGit);

  /**
   * @namespace cf-app-push.accountActions
   * @memberof cf-app-push
   * @name DeploySourceGit
   * @description Directive to aid user in selecting a git source for their application
   * @returns {object} The DeploySourceGit directive definition object
   */
  function DeploySourceGit() {
    return {
      scope: {
        sourceType: '=',
        userInput: '=',
        valid: '=',
        dropInfo: '='
      },
      bindToController: true,
      controller: DeploySourceGitController,
      controllerAs: 'dplyGitCtrl',
      templateUrl: 'plugins/cf-app-push/view/deploy-app-workflow/deploy-step-source/deploy-source-git/deploy-source-git.html'
    };
  }

  /**
   * @namespace cf-app-push.DeploySourceGitController
   * @memberof cf-app-push
   * @name DeploySourceGitController
   * @param {object} $http - the angular $http service
   * @param {object} $scope - the angular $scope service
   * @constructor
   */
  function DeploySourceGitController($http, $scope) {
    var vm = this;

    vm.data = {
      githubBranches: []
    };

    vm.userInput.gitType = vm.userInput.gitType || 'github';
    vm.userInput.gitUrlBranch = vm.userInput.gitUrlBranch || 'master';

    vm.isGithub = isGithub;
    vm.isGitUrl = isGitUrl;
    // For now mandate https (pp container does not support ssh)
    vm.gitUrlRegEx = /https:(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;
    // vm.gitUrlRegEx = /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;

    var gitHubUrlBase = 'https://github.com/';

    var debounceGithubProjectFetch = _.debounce(function () {
      var project = vm.userInput.githubProject;
      if (!project || project.length === 0) {
        vm.userInput.githubProjectValid = false;
        return;
      }

      $http.get('https://api.github.com/repos/' + project)
        .then(function (response) {
          vm.userInput.githubProjectValid = true;
          vm.data.githubProject = response.data;
          vm.userInput.githubProjectCached = project;

          $http.get('https://api.github.com/repos/' + project + '/branches')
            .then(function (response) {
              vm.data.githubBranches.length = 0;
              [].push.apply(vm.data.githubBranches, _.map(response.data, function selectOptionMapping(o) {
                return {
                  label: o.name,
                  value: o
                };
              }));

              var branch = vm.userInput.autoSelectGithubBranch ? vm.userInput.autoSelectGithubBranch : vm.data.githubProject.default_branch;
              vm.userInput.autoSelectGithubBranch = undefined;
              var foundBranch = _.find(vm.data.githubBranches, function (o) {
                return o.value && o.value.name === branch;
              });
              vm.userInput.githubBranch = foundBranch ? foundBranch.value : undefined;
            })
            .catch(function () {
              vm.data.githubBranches.length = 0;
            });

        })
        .catch(function (response) {
          if (response.status === 404) {
            vm.userInput.githubProjectValid = false;
            vm.data.githubBranches.length = 0;
            delete vm.userInput.githubBranch;
            delete vm.data.githubCommit;
          }
        });
    }, 1000);

    $scope.$watch(function () {
      var gitType = vm.userInput.gitType;
      var gitHub = vm.userInput.githubProject &&
        vm.userInput.githubBranch &&
        vm.userInput.githubBranch.name || false;
      var gitUrl = vm.userInput.gitUrl && vm.userInput.gitUrlBranch || false;
      return gitType.toString() + gitHub.toString() + gitUrl.toString();
    }, updateValid);

    $scope.$watch('dplyGitCtrl.userInput.githubProject', function (newVal, oldVal) {
      if (oldVal !== newVal) {
        debounceGithubProjectFetch();
      }
    });

    $scope.$watch('dplyGitCtrl.userInput.githubBranch', function (newVal, oldVal) {
      if (newVal && oldVal !== newVal) {
        $http.get('https://api.github.com/repos/' + vm.userInput.githubProject + '/commits/' + newVal.commit.sha)
          .then(function (response) {
            vm.data.githubCommit = response.data;
          })
          .catch(function () {
            delete vm.data.githubCommit;
          });
      }
    });

    $scope.$watch('dplyGitCtrl.dropInfo', function (newVal, oldVal) {
      if (oldVal !== newVal) {
        var info = newVal;
        if (!info.isWebLink || !angular.isString(info.value)) {
          return;
        }

        if (vm.gitUrlRegEx.test(info.value)) {
          vm.sourceType = 'git';
          vm.userInput.gitType = 'giturl';
          vm.userInput.gitUrl = info.value;
        } else if (info.value.toLowerCase().indexOf(gitHubUrlBase) === 0) {
          // Check if this is a GitHub link
          vm.sourceType = 'git';
          vm.userInput.gitType = 'github';
          var urlParts = info.value.substring(gitHubUrlBase.length).split('/');
          if (urlParts.length > 1) {
            var branch;
            if (urlParts.length > 3 && urlParts[2] === 'tree') {
              branch = urlParts[3];
            }
            var project = urlParts[0] + '/' + urlParts[1];
            if (vm.userInput.githubProject === project) {
              // Project is the same, so just change the branch
              selectBranch(branch ? branch : vm.data.githubProject.default_branch);
            } else {
              vm.userInput.autoSelectGithubBranch = branch;
              vm.userInput.githubProject = project;
            }
          }
        }
      }
    });

    function isGithub() {
      return vm.userInput.gitType === 'github';
    }

    function isGitUrl() {
      return vm.userInput.gitType === 'giturl';
    }

    function selectBranch(branch) {
      var foundBranch = _.find(vm.data.githubBranches, function (o) {
        return o.value && o.value.name === branch;
      });
      vm.userInput.githubBranch = foundBranch ? foundBranch.value : undefined;
    }

    function isGitUrlValid() {
      return $scope.formGitUrl.$valid;
    }

    function isGithubValid() {
      return vm.userInput.githubProjectValid &&
        vm.userInput.githubProject &&
        vm.userInput.githubBranch &&
        vm.userInput.githubBranch.name;
    }

    function updateValid() {
      switch (vm.userInput.gitType) {
        case 'giturl':
          vm.valid = !!isGitUrlValid();
          break;
        case 'github':
          vm.valid = !!isGithubValid();
          break;
        default:
          vm.valid = false;
          break;
      }
    }

  }

})();
