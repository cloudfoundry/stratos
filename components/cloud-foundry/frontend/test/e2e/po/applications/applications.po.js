(function () {
  'use strict';

  var navbar = require('../../../../../../app-core/frontend/test/e2e/po/navbar.po');
  var helpers = require('../../../../../../app-core/frontend/test/e2e/po/helpers.po');
  var inputSelectInput = require('../../../../../../app-core/frontend/test/e2e/po/widgets/input-select-input.po');

  module.exports = {
    getTitle: getTitle,

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
    getAddAppWhenNoApps: getAddAppWhenNoApps,

    getAppCount: getAppCount,

    setSortOrder: setSortOrder,
    toggleSortDirection: toggleSortDirection,

    setGridView: setGridView,
    setListView: setListView,

    isGridView: isGridView,
    isListView: isListView

  };

  function getTitle() {
    return element(by.css('.applications-header > span')).getText();
  }

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
    return element(by.css('.application-search-box .form-group.search-field'));
  }

  function resetFilters() {
    return element(by.css('.app-count .reset-link .btn-link')).click();
  }

  function getAddAppWhenNoApps() {
    return element(by.css('.applications-cta .btn.btn-link'));
  }

  function getSortDropDown() {
    return inputSelectInput.wrap(element(by.css('applications-sorting .form-group')));
  }

  function setSortOrder(name) {
    return getSortDropDown().selectOptionByLabel(name);
  }

  function toggleSortDirection() {
    return element(by.css('applications-sorting .sort-asc-desc-btn')).click();
  }

  function getAppCount() {
    return element(by.css('.app-count-number')).getText();
  }

  // Grid and List view
  function getViewButtonElement(index) {
    return element.all(by.css('.application-main-controls .view-buttons button')).get(index);
  }

  function setGridView() {
    return getViewButtonElement(1).click();
  }

  function setListView() {
    return getViewButtonElement(0).click();
  }

  function isGridView() {
    return helpers.hasClass(getViewButtonElement(1), 'btn-active');
  }

  function isListView() {
    return helpers.hasClass(getViewButtonElement(0), 'btn-active');
  }
})();
