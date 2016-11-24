(function () {
  'use strict';

  // Navbar helpers
  module.exports = {

    navBarElement: navBarElement,
    goToView: goToView,

    showAccountSettings: showAccountSettings,
    logout: logout

  };

  function navBarElement() {
    return element(by.css('navigation'));
  }

  function goToView(viewName) {
    var id = 'navbar-item-' + viewName.toLowerCase();
    return element(by.css('navigation'))
      .element(by.id(id))
      .click();
  }

  function showAccountSettings() {
    return goToView('account-settings');
  }

  function logout() {
    return element(by.id('navbar-user-menu-dropdown'))
      .click().then(function () {
        browser.driver.sleep(100);
        return element(by.id('navbar-item-logout')).click().then(function () {
          browser.driver.sleep(100);
        });
      });
  }
})();
