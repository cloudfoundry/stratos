(function () {
  'use strict';

  angular
    .module('cf-app-push')
    .directive('appDeploySourceGit', DeploySourceGit);

  /**
   * @namespace cf-app-push.accountActions
   * @memberof cf-app-push
   * @name DeploySourceGit
   * @description ????????
   * @returns {object} The ???????? directive definition object
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
      return vm.userInput.githubProjectValid && vm.userInput.githubProject && vm.userInput.githubBranch.name;
    }, function (newVal) {
      vm.valid = newVal;
    });

    $scope.$watch(function () {
      return vm.userInput.githubProject;
    }, function (newVal, oldVal) {
      if (oldVal !== newVal) {
        debounceGithubProjectFetch();
      }
    });

    $scope.$watch(function () {
      return vm.userInput.githubBranch;
    }, function (newVal, oldVal) {
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

    $scope.$watch(function () {
      return vm.dropInfo;
    }, function (newVal, oldVal) {
      if (oldVal !== newVal) {
        var info = newVal;
        // Check if this is a GitHub link
        if (angular.isString(info.value) && info.value.toLowerCase().indexOf(gitHubUrlBase) === 0) {
          vm.sourceType = 'github';
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

    function selectBranch(branch) {
      var foundBranch = _.find(vm.data.githubBranches, function (o) {
        return o.value && o.value.name === branch;
      });
      vm.userInput.githubBranch = foundBranch ? foundBranch.value : undefined;
    }

  }

})();
