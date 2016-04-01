'use strict';

// Navbar helpers
module.exports = {

  goToView: goToView,

  accountActionsButton: accountActionsButton,
  showAccountActions: showAccountActions,
  showAccountSettings: showAccountSettings,
  logout: logout

};

function goToView(viewName) {
  return element(by.css('navigation'))
    .element(by.linkText(viewName))
    .click();
}

function accountActionsButton() {
  return element(by.css('avatar'))
    .element(by.css('[ng-click="avatarCtrl.showActions()"]'))
}

function showAccountActions() {
  accountActionsButton().click();
}

function showAccountSettings() {
  showAccountActions();
  element(by.css('account-actions'))
    .element(by.css('[href="#/account/settings"]'))
    .click();
}

function logout() {
  showAccountActions();
  element(by.css('account-actions'))
    .element(by.css('[ng-click="applicationCtrl.logout()"]'))
    .click();
}
