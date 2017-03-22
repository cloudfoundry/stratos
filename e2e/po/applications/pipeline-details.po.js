(function () {
  'use strict';
  var Q = require('../../../tools/node_modules/q');

  module.exports = {
    enterPipelineDetails: enterPipelineDetails,
    invalidPasswordMessage: invalidPasswordMessage
  };

  function enterPipelineDetails(branchNames, buildContainer, clusterUsername, clusterPassword) {

    // NOTE: Can't use helpers.getForm* here, since the form is distributed

    // Select the first available test branch
    selectBranch(branchNames);

    selectBuildContainer(buildContainer);

    var clusterUsernameField = element(by.model('wizardCtrl.options.userInput.clusterUsername'));
    clusterUsernameField.clear();
    clusterUsernameField.sendKeys(clusterUsername);

    var clusterPasswordField = element(by.model('wizardCtrl.options.userInput.clusterPassword'));
    clusterPasswordField.clear();
    return clusterPasswordField.sendKeys(clusterPassword);
  }

  function selectBranch(branchNames) {

    var branchField = element(by.model('wizardCtrl.options.userInput.branch'));
    branchField.click();
    var promises = [];

    function clickOnBranch(branchName) {
      return branchField.element(by.cssContainingText('.select-option', branchName)).getAttribute('disabled')
        .then(function (isDisabled) {
          if (!isDisabled) {
            return branchField.element(by.cssContainingText('.select-option', branchName)).click();
          }
          return Q.resolve();
        });
    }

    for (var branch in branchNames) {
      if (!branchNames.hasOwnProperty(branch)) {
        continue;
      }
      promises.push(clickOnBranch(branchNames[branch]));
    }

    return Q.any(promises);
  }

  function selectBuildContainer(buildContainer) {
    var buildContainerField = element(by.model('wizardCtrl.options.userInput.buildContainer'));
    buildContainerField.click();
    return buildContainerField.element(by.cssContainingText('.select-option', buildContainer)).click();
  }

  function invalidPasswordMessage() {
    return element(by.css('.alert-danger'));
  }

})();
