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
  addApplication: addApplication
};

function applicationGalleryCard(idx) {
  return applicationGalleryCards().get(idx)
    .element(by.css('gallery-card'));
}

function applicationGalleryCards() {
  return element.all(by.css('application-gallery-card'));
}

function showApplications() {
  navbar.goToView('Applications');
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
  // element(by.css('.action-bar .btn.btn-primary'));
  return element(by.buttonTest('Add Application'));
}


function addApplication() {
  return getAddApplicationButton().click();
}
