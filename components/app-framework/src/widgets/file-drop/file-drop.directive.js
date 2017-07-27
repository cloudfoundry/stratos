(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('fileDrop', fileDrop);

  function fileDrop() {
    var directive = {
      link: link,
      restrict: 'A',
      scope: {
        fileDrop: '=',
        itemDrop: '=?'
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
        var items = evt.dataTransfer.items;

        // Either notify the drop handler or set the model value
        if (items.length > 0 && scope.itemDrop) {
          scope.$apply(function () {
            scope.itemDrop(items);
          });
        } else if (files.length > 0) {
          scope.$apply(function () {
            scope.fileDrop = files[0];
          });
        }
      });
    }
  }
})();
