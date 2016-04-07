'use strict';

var navbar = require('./navbar.po');

module.exports = {

  applicationGalleryCards: applicationGalleryCards,
  applicationGalleryCard: applicationGalleryCard,

  showApplications: showApplications,
  showApplicationDetails: showApplicationDetails,
  showServices: showServices(),

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

function showServices() {
  servicesAction().click();
}

function applicationsActionsBar(){
 return element.all(by.css('ul.nav.nav-pills.nav-stacked li a'));
}

function servicesAction(){
  return applicationAction(1);
}

function applicationAction(idx) {
     return applicationsActionsBar().get(idx);
}

function serviceDetailsActions(){
  return element.all(by.css('div.service-detail-actions button'));
}

function serviceDetailsAction(idx) {
     return serviceDetailsActions().get(idx);
}

function showServiceDetails() {
  serviceDetailsAddAction().click();
}

function serviceDetailsAddAction(){
  return serviceDetailsAction(1);
}

function serviceDetailsCancelAction(){
  return serviceDetailsAction(0);
}

function applicationServiceFlyout(){
 return element(by.css('div.flyout application-service'));
}

function serviceAddConfirm(){
  serviceDetailsAddAction().click();
}

function serviceAddCancel(){
  serviceDetailsCancelAction().click();
}


