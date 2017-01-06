(function () {
  'use strict';

  module.exports = {
    enterPipelineDetails: enterPipelineDetails,
    invalidPasswordMessage: invalidPasswordMessage
  };

  function enterPipelineDetails(branchName, buildContainer, clusterUsername, clusterPassword) {

    var branchField = element(by.model('wizardCtrl.options.userInput.branch'));
    branchField.sendKeys(branchName);

    var buildContainerField = element(by.model('wizardCtrl.options.userInput.buildContainer'));
    buildContainerField.sendKeys(buildContainer);

    var clusterUsernameField = element(by.model('wizardCtrl.options.userInput.clusterUsername'));
    clusterUsernameField.sendKeys(clusterUsername);

    var clusterPasswordField = element(by.model('wizardCtrl.options.userInput.clusterPassword'));
    return clusterPasswordField.sendKeys(clusterPassword);
  }

  function invalidPasswordMessage() {
    return element(by.css('.alert-danger'));
   }

})();
