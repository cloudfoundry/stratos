(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('passwordReveal', passwordReveal);

  function passwordReveal($compile) {
    return {
      link: function (scope, element) {
        var showPassword = false;

        var markup = '<i class="material-icons password-reveal form-control-feedback text-muted">visibility</i>';
        var eyeElement = angular.element(markup);

        eyeElement.on('click', function clickHandler() {
          showPassword = !showPassword;

          var inputType = showPassword ? 'text' : 'password';
          element.attr('type', inputType);
          eyeElement.toggleClass('text-muted');
        });

        element.after(eyeElement);

        $compile(eyeElement)(scope);
      },
      restrict: 'A',
      scope: {
      }
    };
  }

})();
