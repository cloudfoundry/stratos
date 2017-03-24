(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('fileDrop', fileDrop);

  function fileDrop() {
    var directive = {
      link: link,
      restrict: 'A',
      scope: {
        fileDrop: '='
      }
    };
    return directive;

    function link(scope, element) {

      element[0].addEventListener('dragenter', function (evt) {
        element.addClass('file-drop-active');
        evt.preventDefault();
        evt.stopPropagation();
      });

      element[0].addEventListener('dragleave', function () {
        element.removeClass('file-drop-active');
      });
      element[0].addEventListener('dragover', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        element.addClass('file-drop-active');
      });

      element[0].addEventListener('drop', function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
        element.removeClass('file-drop-active');

        var files = evt.dataTransfer.files;
        if (files.length > 0) {
          scope.$apply(function () {
            scope.fileDrop = files[0];
          });
        }
      });
    }
  }
})();
