(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('fileread', fileRead);

  function fileRead() {
    var directive = {
      link: link,
      restrict: 'A',
      scope: {
        fileread: '=',
        filereadMultiple: '='
      }
    };
    return directive;

    function link(scope, element) {
      element.bind('change', function (changeEvent) {
        scope.$apply(function () {
          if (scope.filereadMultiple) {
            scope.fileread = changeEvent.target.files;
          } else {
            scope.fileread = changeEvent.target.files[0];
          }
        });
      });

      scope.$watch('fileread', function (nv, ov) {
        if (ov && ov.name && nv && !nv.name) {
          element.val(null);
        }
      });
    }
  }
})();
