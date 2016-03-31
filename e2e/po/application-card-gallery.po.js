'use strict';
var loginPage = require('./login-page.po');

// Navbar helpers
module.exports = {

  showAppDetails: showAppDetails

};

function applicationGalleryCard() {
  return element.all(by.css('application-gallery-card')).get(0)
    .element(by.css('gallery-card'));

}

function applicationsGalleryButton() {
  return element(by.css('navigation'))
    .element(by.css('[href="#cf/applications/list/gallery-view"]'));
}

function showApplicationsGallery() {
  applicationsGalleryButton().click();
}

function showApplicationDetail(){
  applicationGalleryCard().click();
}



function showAppDetails() {
  login();
  showApplicationsGallery();
  showApplicationDetail();
}

function login(){
  var fields = loginPage.loginFormFields();
  var usernameField = fields.get(0);
  usernameField.clear();
  usernameField.sendKeys('dev');
  fields.get(1).sendKeys('dev');
  loginPage.loginButton().click();
}
