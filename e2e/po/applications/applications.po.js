(function () {
  'use strict';

  var navbar = require('../navbar.po');
  var helpers = require('../helpers.po');

  module.exports = {

    applicationGalleryCards: applicationGalleryCards,
    applicationGalleryCard: applicationGalleryCard,

    showApplications: showApplications,
    showApplicationDetails: showApplicationDetails,

    isApplicationWall: isApplicationWall,
    isApplicationWallNoClusters: isApplicationWallNoClusters,

    getAddApplicationButton: getAddApplicationButton,
    addApplication: addApplication,
    clickEndpointsDashboard: clickEndpointsDashboard,

    appNameSearch: appNameSearch,
    resetFilters: resetFilters,
    getAddAppWhenNoApps: getAddAppWhenNoApps
  };

  function applicationGalleryCard(idx) {
    return applicationGalleryCards().get(idx)
      .element(by.css('gallery-card'));
  }

  function applicationGalleryCards() {
    return element.all(by.css('application-gallery-card'));
  }

  function showApplications() {
    return navbar.goToView('cf.applications');
  }

  function showApplicationDetails(idx) {
    applicationGalleryCard(idx).click();
  }

  function isApplicationWall() {
    return browser.getCurrentUrl().then(function (url) {
      return url === helpers.getHost() + '/#/cf/applications/list/gallery-view';
    });
  }

  function isApplicationWallNoClusters() {
    return isApplicationWall().then(function () {
      return element(by.css('.applications-empty .applications-msg'));
    });
  }

  function getAddApplicationButton() {
    return element(by.id('app-wall-add-new-application-btn'));
  }

  function addApplication() {
    return getAddApplicationButton().click();
  }

  function clickEndpointsDashboard() {
    return element(by.css('.applications-cta a')).click();
  }

  function appNameSearch() {
    return element(by.css('.app-actions-bar .form-group.search-field'));
  }

  function resetFilters() {
    return element(by.css('.reset-link .btn-link')).click();
  }

  function getAddAppWhenNoApps() {
    return element(by.css('.applications-cta .btn.btn-link'));
  }
})();
