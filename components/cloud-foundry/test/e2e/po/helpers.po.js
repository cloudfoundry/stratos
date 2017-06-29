/* eslint-disable angular/json-functions,angular/log,no-console,no-process-env */
(function () {
  'use strict';

  var cnsis = browser.params.cnsi;
  var cfs = cnsis.cf || {};

  // This makes identification of acceptance test apps easier in case they leak
  var e2eItemPrefix = 'acceptance.e2e.';
  var customAppLabel = e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER);
  var customOrgSpaceLabel = e2eItemPrefix + (process.env.CUSTOM_ORG_SPACE_LABEL || process.env.USER);

  module.exports = {

    getCfs: getCfs,

    skipIfNoCF: skipIfNoCF,
    skipIfNoSecondCF: skipIfNoSecondCF,
    skipIfOnlyOneCF: skipIfOnlyOneCF,
    skipIfNoAppWithLogStream: skipIfNoAppWithLogStream,

    getAppNameWithLogStream: getAppNameWithLogStream,

    getCustomAppName: getCustomAppName,
    getCustomerOrgSpaceLabel: getCustomerOrgSpaceLabel
  };

  function getCfs() {
    return cfs;
  }

  // Test skip helpers
  function skipIfNoCF() {
    return !getCfs() || !getCfs().cf1;
  }

  function skipIfNoSecondCF() {
    return !getCfs() || !getCfs().cf2;
  }

  function skipIfOnlyOneCF() {
    return !getCfs() || Object.keys(getCfs()).length < 2;
  }

  function skipIfNoAppWithLogStream() {
    var haveNcf = getCfs() && Object.keys(getCfs()).length > 0;
    return !haveNcf || !browser.params.appWithLogStream;
  }

  function getAppNameWithLogStream() {
    return browser.params.appWithLogStream;
  }

  function getCustomAppName(isoTime) {
    return customAppLabel + '.' + (isoTime || (new Date()).toISOString());
  }

  function getCustomerOrgSpaceLabel(isoTime, orgSpace) {
    return customOrgSpaceLabel + '.' + orgSpace + '.' + (isoTime || (new Date()).toISOString());
  }

})();
