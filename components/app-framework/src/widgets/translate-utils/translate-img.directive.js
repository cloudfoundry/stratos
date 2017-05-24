(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('translateImg', translateImg);

  function translateImg($document, $translate) {
    // Is the browser IE ?
    var msie = $document.documentMode;

    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var translationId = attrs.translateImg;
        if (translationId) {
          $translate(translationId).then(function (value) {
            if (value) {
              element.attr('src', value);
              if (msie && propName) {
                element.prop(propName, attr[name]);
              }
              element.removeClass('ng-hide');
            } else {
              // Hide the image - empty value
              element.addClass('ng-hide');
              element.attr('src', null);
            }
          }).catch(function () {
            // Hide the image - no translation found
            element.addClass('ng-hide');
            element.attr('src', null);
          });
        }
      }
    };
  }
})();
