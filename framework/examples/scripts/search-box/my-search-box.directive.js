(function () {
  'use strict';

  angular
    .module('helionFrameworkExamples')
    .directive('mySearchBox', mySearchBox);

  mySearchBox.$inject = [
    'helionFrameworkExamples.basePath'
  ];

  function mySearchBox(path) {
    return {
      controller: MySearchBoxController,
      controllerAs: 'mySearchBoxCtrl',
      templateUrl: path + 'search-box/my-search-box.html'
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
