(function () {
  'use strict';

  angular
    .module('helionFrameworkExamples')
    .controller('flyoutExampleController', FlyoutExampleController);

  FlyoutExampleController.$inject = ['helionFrameworkExamples.basePath'];

  function FlyoutExampleController(path) {
    this.flyoutActive = false;
    this.flyoutTemplateUrl = path + 'flyout/flyout-example.html';
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
