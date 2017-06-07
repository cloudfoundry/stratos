(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('preventDrop', preventDrop);

  function preventDrop($window) {
    var directive = {
      link: link,
      restrict: 'A'
    };
    return directive;

    function link() {

      $window.addEventListener('dragover', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      });

      $window.addEventListener('drop', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      });
    }
  }
})();
