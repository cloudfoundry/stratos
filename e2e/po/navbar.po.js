'use strict';

// Navbar helpers
module.exports = {

  accountActionsButton: accountActionsButton,
  showAccountActions: showAccountActions,
  logout: logout

};

function accountActionsButton() {
  return element(by.css('avatar'))
    .element(by.css('[ng-click="avatarCtrl.showHideActions()"]'))
}

function showAccountActions() {
  accountActionsButton().click();
}

function logout() {
  showAccountActions();
  element(by.css('account-actions'))
    .element(by.css('[ng-click="applicationCtrl.logout()"]'))
    .click();
}
