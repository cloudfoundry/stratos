(function () {
  'use strict';

  var _ = require('../../../tools/node_modules/lodash');
  var helpers = require('../helpers.po');

  module.exports = {
    wrap: wrap,

    getPrimary: getPrimary,
    getCancel: getCancel,
    getTitleText: getTitleText,

    isCancelEnabled: isCancelEnabled,
    isPrimaryEnabled: isPrimaryEnabled,
    isErrored: isErrored,

    cancel: cancel,
    done: primary
  };

  function wrap(element) {
    return {
      getDone: _.partial(getPrimary, element),
      getCancel: _.partial(getCancel, element),
      getCommit: _.partial(getCommit, element),

      isCancelEnabled: _.partial(isCancelEnabled, element),
      isPrimaryEnabled: _.partial(isPrimaryEnabled, element),
      isCommitEnabled: _.partial(isCommitEnabled, element),
      isErrored: _.partial(isErrored, element),

      cancel: _.partial(cancel, element),
      primary: _.partial(primary, element),
      commit: _.partial(commit, element)
    };
  }

  function getPrimary(ele) {
    return ele.element(by.css('.btn-primary'));
  }

  function getCommit(ele) {
    return ele.element(by.css('.btn-commit'));
  }

  function getCancel(ele) {
    return ele.element(by.css('.btn-default'));
  }

  function getTitleText(ele) {
    return ele.element(by.css('.detail-view-header')).getText();
  }

  function isCancelEnabled(element) {
    return _buttonEnabled(getCancel(element));
  }

  function isPrimaryEnabled(element) {
    return _buttonEnabled(getPrimary(element));
  }

  function isCommitEnabled(element) {
    return _buttonEnabled(getCommit(element));
  }

  function isErrored(ele) {
    return ele.element(by.css('.alert-danger')).isPresent();
  }

  function cancel(element) {
    return getCancel(element).click();
  }

  function primary(element) {
    return getPrimary(element).click();
  }

  function commit(element) {
    return getCommit(element).click();
  }

  function _buttonEnabled(element) {
    return helpers.isButtonEnabled(element);
  }
})();
