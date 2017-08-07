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
   * @description Directive to aid user in selecting an example to deploy
   * @returns {object} The appDeploySourceExample directive definition object
   */
  function DeploySourceExample() {
    return {
      scope: {
        sourceType: '=',
        userInput: '=',
        valid: '='
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
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $q - the angular $q service
   * @param {array} appDeploySourceExamples - collection of examples to display
   * @param {object} frameworkAsyncTaskDialog - our async dialog service
   * @constructor
   */
  function DeploySourceExampleController($timeout, $q, appDeploySourceExamples, frameworkAsyncTaskDialog) {
    var vm = this;

    vm.showModal = showModal;

    function showModal() {
      return frameworkAsyncTaskDialog(
        {
          title: 'deploy-app-dialog.step-source.example.modal',
          templateUrl: 'plugins/cf-app-push/view/deploy-app-workflow/deploy-step-source/deploy-source-example/deploy-source-example-modal.html',
          buttonTitles: {
            submit: 'deploy-app-dialog.step-source.example.modal.select'
          },
          class: 'deploy-app-example-modal dialog-form-wizard',
          dialog: true
        },
        {
          data: {
            examples: appDeploySourceExamples,
            selection: appDeploySourceExamples[0]
          }
        },
        function (exampleData) {
          vm.userInput.example = exampleData.selection;
          return $q.resolve();
        }
      ).result.then(function () {
        // The deploy button based on this property can become visible quickly. This could lead a potential double
        // clicker to deploy straight away. Leave some time to avoid this
        $timeout(function () {
          vm.valid = !!vm.userInput.example;
        }, 350);
      });
    }
  }

})();
