(function () {
  'use strict';

  // Navbar helpers
  module.exports = {

    navBarElement: navBarElement,
    goToView: goToView,

    accountActionsButton: accountActionsButton,
    showAccountActions: showAccountActions,
    showAccountSettings: showAccountSettings,
    logout: logout

  };

  function navBarElement() {
    return element(by.css('navigation'));
  }

  function goToView(viewName) {
    return element(by.css('navigation'))
      .element(by.linkText(viewName))
      .click();
  }

  function accountActionsButton() {
    return element(by.css('avatar'))
      .element(by.css('[ng-click="avatarCtrl.showActions()"]'));
  }

  function showAccountActions() {
    return accountActionsButton().click();
  }

  function showAccountSettings() {
    return showAccountActions().then(function () {
      return element(by.css('account-actions'))
        .element(by.css('[href="#/account/settings"]'))
        .click();
    });
  }

  function logout() {
    return showAccountActions().then(function () {
      return element(by.css('account-actions'))
        .element(by.css('[ng-click="applicationCtrl.logout()"]'))
        .click().then(function () {
          browser.driver.sleep(100);
        });
    });
  }
})();
