(function () {
  'use strict';

  var helpers = require('../helpers.po');

  module.exports = {
    getFilterform: getFilterform,
    getFilterformFields: getFilterformFields,
    enterRepositoryFilter: enterRepositoryFilter,
    getRepositories: getRepositories,
    selectFirstRepository: selectFirstRepository
  };

  function getFilterform() {
    return helpers.getForm('select-repository');
  }

  function getFilterformFields() {
    return helpers.getFormFields('select-repository');
  }

  function getRepositories() {
    return element.all(by.repeater('repo in wizardCtrl.options.displayedRepos'));
  }

  function selectFirstRepository() {
    return element(by.css('.radio-input-button')).click();
  }

  function enterRepositoryFilter(repoName) {
    var fields = getFilterformFields();
    fields.get(1).clear();
    return fields.get(1).sendKeys(repoName);
  }
})();
