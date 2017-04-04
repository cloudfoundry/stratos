(function () {
  'use strict';

  var helpers = require('./helpers.po');

  // Navbar helpers
  module.exports = {

    navBarElement: navBarElement,
    goToView: goToView,

    showAccountSettings: showAccountSettings,
    logout: logout,

    toggleNavBar: toggleNavBar,
    isIconsOnly: isIconsOnly,
    setLabelsShown: setLabelsShown

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

  function toggleNavBar() {
    return element(by.css('.navbar-toggle-labels > i')).click();
  }

  function isIconsOnly() {
    return helpers.hasClass(element(by.css('navbar nav')), 'navbar-icons-only');
  }

  function setLabelsShown() {
    return isIconsOnly().then(function (iconsOnly) {
      if (iconsOnly) {
        return toggleNavBar();
      }
    });
  }
})();

