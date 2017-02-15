(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('contenteditable', contentEditable);

  // See: https://docs.angularjs.org/api/ng/type/ngModel.NgModelController#custom-control-example
  contentEditable.$inject = ['$sce'];
  function contentEditable($sce) {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function (scope, element, attrs, ngModel) {
        if (!ngModel) { return; } // do nothing if no ng-model

        // Specify how UI should be updated
        ngModel.$render = function () {
          element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
        };

        // Listen for change events to enable binding
        element.on('blur keyup change', function () {
          scope.$evalAsync(read);
        });

        // Prevent crazy HTML paste inside content-editable elements
        element.on('paste', function (e) {
          // cancel paste
          e.preventDefault();

          // get text representation of clipboard
          var text = (e.originalEvent || e).clipboardData.getData('text/plain');

          // insert text manually
          document.execCommand('insertHTML', false, text);
        });

        read(); // initialize

        // Write data to the model
        function read() {
          var html = element.html();
          // When we clear the content editable certain browsers (e.g. Firefox) leave a <br> behind
          if (_.endsWith(html, '<br>')) {
            html = html.slice(0, -4);
          }
          ngModel.$setViewValue(html);
        }
      }
    };
  }
})();
