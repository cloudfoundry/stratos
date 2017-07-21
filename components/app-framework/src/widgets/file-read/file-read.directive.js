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
        fileread: '='
      }
    };
    return directive;

    function link(scope, element) {
      element.bind('change', function (changeEvent) {
        scope.$apply(function () {
          scope.fileread = changeEvent.target.files;
        });
      });

      scope.$watch('fileread', function (nv, ov) {
        if (ov && ov.length && nv && !nv.length) {
          element.val(null);
        }
      });
    }
  }
})();

