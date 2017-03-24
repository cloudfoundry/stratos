(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('passwordReveal', passwordReveal);

  passwordReveal.$inject = ['$compile'];

  function passwordReveal($compile) {
    return {
      link: function (scope, element) {
        scope.showPassword = false;

        var eyeIcon = scope.passwordRevealIcon || 'glyphicon glyphicon-eye-open';
        var markup = '<span class="' + eyeIcon + ' password-reveal form-control-feedback text-muted"></span>';
        var eyeElement = angular.element(markup);

        eyeElement.on('click', function clickHandler() {
          scope.showPassword = !scope.showPassword;

          var inputType = scope.showPassword ? 'text' : 'password';
          element.attr('type', inputType);
          eyeElement.toggleClass('text-muted');
        });

        element.after(eyeElement);

        $compile(eyeElement)(scope);
      },
      restrict: 'A',
      scope: {
        passwordRevealIcon: '=?'
      }
    };
  }

})();
