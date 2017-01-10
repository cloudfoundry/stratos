(function () {
  'use strict';

  module.exports = {
    enterPipelineDetails: enterPipelineDetails,
    invalidPasswordMessage: invalidPasswordMessage
  };

  function enterPipelineDetails(branchName, buildContainer, clusterUsername, clusterPassword) {

    // NOTE: Can't use helpers.getForm* here, since the form is distributed

    var branchField = element(by.model('wizardCtrl.options.userInput.branch'));
    branchField.sendKeys(branchName);

    var buildContainerField = element(by.model('wizardCtrl.options.userInput.buildContainer'));
    buildContainerField.sendKeys(buildContainer);

    var clusterUsernameField = element(by.model('wizardCtrl.options.userInput.clusterUsername'));
    clusterUsernameField.clear();
    clusterUsernameField.sendKeys(clusterUsername);

    var clusterPasswordField = element(by.model('wizardCtrl.options.userInput.clusterPassword'));
    clusterPasswordField.clear();
    return clusterPasswordField.sendKeys(clusterPassword);
  }

  function invalidPasswordMessage() {
    return element(by.css('.alert-danger'));
  }

})();
