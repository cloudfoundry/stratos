(function () {
  'use strict';

  angular
    .module('app-examples.widgets')
    .controller('flyoutExampleController', FlyoutExampleController);

  function FlyoutExampleController() {
    this.flyoutActive = false;
    this.flyoutTemplateUrl = 'app-examples/flyout/flyout-example.html';
  }

  angular.extend(FlyoutExampleController.prototype, {
    open: function () {
      this.flyoutActive = true;
    },
    close: function () {
      this.flyoutActive = false;
    }
  });

})();
