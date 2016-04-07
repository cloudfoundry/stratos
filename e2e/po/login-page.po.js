'use strict';

// Login page helpers
var helpers = require('./helpers.po');

module.exports = {

  contentIndicator: contentIndicator,
  contentIndicatorSquares: contentIndicatorSquares,
  contentSections: contentSections,
  nextArrow: nextArrow,
  prevArrow: prevArrow,

  login: login,
  loginAsAdmin: loginAsAdmin,
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

function login() {
  var fields = loginFormFields();
  fields.get(0).sendKeys('dev');
  fields.get(1).sendKeys('dev');
  loginButton().click();
  browser.driver.sleep(1000);
}

function loginAsAdmin() {
  var fields = loginFormFields();
  fields.get(0).sendKeys('admin');
  fields.get(1).sendKeys('admin');
  loginButton().click();
  browser.driver.sleep(1000);
}
