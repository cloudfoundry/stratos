(function () {
  'use strict';

  angular
    .module('app-examples.widgets')
    .directive('mySearchBox', mySearchBox);

  function mySearchBox() {
    return {
      controller: MySearchBoxController,
      controllerAs: 'mySearchBoxCtrl',
      templateUrl: 'app-examples/search-box/my-search-box.html'
    };
  }

  MySearchBoxController.$inject = [
  ];

  function MySearchBoxController() {
    this.inputOptions = [
      { label: 'Red', value: '#700' },
      { label: 'Green', value: '#070' },
      { label: 'Blue', value: '#007' }
    ];
    this.inputModel = null;
  }

  angular.extend(MySearchBoxController.prototype, {
  });

})();
