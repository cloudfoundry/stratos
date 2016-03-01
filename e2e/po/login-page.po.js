'use strict';

// Login page helpers
var helpers = require('./helpers.po');

module.exports = {

  contentIndicator: contentIndicator,
  contentIndicatorSquares: contentIndicatorSquares,
  contentSections: contentSections,
  nextArrow: nextArrow,
  prevArrow: prevArrow,

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
