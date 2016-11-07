'use strict';

// Login page helpers
var helpers = require('./helpers.po');

module.exports = {

  contentIndicator: contentIndicator,
  contentIndicatorSquares: contentIndicatorSquares,
  contentSections: contentSections,
  nextArrow: nextArrow,
  prevArrow: prevArrow,

  enterLogin: enterLogin,
  login: login,
  loginAsAdmin: loginAsAdmin,
  loginAsNonAdmin: loginAsNonAdmin,
  loginButton: loginButton,
  loginFormFields: loginFormFields,
  loginPanel: loginPanel

};

function loginPanel() {
  return element(by.id('section-login-panel'));
}

function loginFormFields() {
  return helpers.getFormFields('loginForm');
}

function loginButton() {
  return helpers.getForm('loginForm').element(by.css('button[type="submit"]'));
}

function contentSections() {
  return element.all(by.css('.content section'));
}

function prevArrow() {
  return element(by.css('.scroll-up'));
}

function nextArrow() {
  return element(by.css('.scroll-down'));
}

function contentIndicator() {
  return element(by.css('.section-status'));
}

function contentIndicatorSquares() {
  return contentIndicator().all(by.css('li'));
}

function enterLogin(username, password) {
  var fields = loginFormFields();
  fields.get(0).clear();
  fields.get(1).clear();
  fields.get(0).sendKeys(username);
  fields.get(1).sendKeys(password);
}

function login(username, password) {
  enterLogin(username, password);
  loginButton().click();
}

function loginAsAdmin() {
  login(helpers.getAdminUser(), helpers.getAdminPassword());
}

function loginAsNonAdmin() {
  login(helpers.getUser(), helpers.getPassword());
}
