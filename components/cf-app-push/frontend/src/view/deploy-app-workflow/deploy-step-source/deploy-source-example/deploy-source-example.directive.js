(function () {
  'use strict';

  angular
    .module('cf-app-push')
    .constant('appDeploySourceExamples', Examples())
    .directive('appDeploySourceExample', DeploySourceExample);

  function Examples() {
    return [
      {
        sourceType: 'github',
        name: 'cf-nodejs',
        description: 'Introduction to Cloud Foundry app deployment and management concepts.',
        descriptionLocalised: '',
        link: 'https://github.com/cloudfoundry-samples/cf-sample-app-nodejs/tree/master',
        userInput: {
          githubProject: 'cloudfoundry-samples/cf-sample-app-nodejs',
          githubBranch: {
            name: 'master'
          }
        }
      },
      {
        sourceType: 'github',
        name: 'test-app',
        description: 'Simple demo or test application for Cloud Foundry',
        descriptionLocalised: '',
        link: 'https://github.com/cloudfoundry-samples/test-app/tree/master',
        userInput: {
          githubProject: 'cloudfoundry-samples/test-app',
          githubBranch: {
            name: 'master'
          }
        }
      },
      {
        sourceType: 'github',
        name: 'php-app',
        description: 'CloudFoundry PHP Example Application: stand alone',
        descriptionLocalised: '',
        link: 'https://github.com/cloudfoundry-samples/cf-ex-stand-alone/tree/master',
        userInput: {
          githubProject: 'cloudfoundry-samples/cf-ex-stand-alone',
          githubBranch: {
            name: 'master'
          }
        }
      }
    ];
  }
  /**
   * @namespace cf-app-push
   * @memberof cf-app-push
   * @name DeploySourceExample
   * @description ????????
   * @returns {object} The ???????? directive definition object
   */
  function DeploySourceExample() {
    return {
      scope: {
        sourceType: '=',
        userInput: '='
      },
      bindToController: true,
      controller: DeploySourceExampleController,
      controllerAs: 'dplyExampleCtrl',
      templateUrl: 'plugins/cf-app-push/view/deploy-app-workflow/deploy-step-source/deploy-source-example/deploy-source-example.html'
    };
  }

  /**
   * @namespace cf-app-push.DeploySourceExampleController
   * @memberof cf-app-push
   * @name DeploySourceExampleController
   * @param {object} $scope - the angular $scope service
   * @param {array} appDeploySourceExamples - collection of examples to display
   * @constructor
   */
  function DeploySourceExampleController($scope, appDeploySourceExamples) {
    var vm = this;

    vm.examples = appDeploySourceExamples;
    vm.selection = appDeploySourceExamples[0];

    $scope.$watch(vm.selection, function (example) {
      if (example) {
        vm.userInput.exampleSourceType = example.sourceType;
        vm.userInput.exampleuserInput = example.userInput;
      }
    });

  }

})();
