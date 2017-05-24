(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('translateHref', translateImg);

  function translateImg($document, $translate) {
    // Is the browser IE ?
    var msie = $document.documentMode;

    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        // Hide until the translation resolves
        element.addClass('ng-hide');
        var translationId = attrs.translateHref;
        if (translationId) {
          $translate(translationId).then(function (value) {
            if (value) {
              element.attr('href', value);
              if (msie && propName) {
                element.prop(propName, attr[name]);
              }
              element.removeClass('ng-hide');
            } else {
              element.addClass('ng-hide');
              element.attr('href', null);
            }
          }).catch(function () {
            // Hide the element - no translation found
            element.addClass('ng-hide');
            element.attr('href', null);
          });
        }
      }
    };
  }
})();
