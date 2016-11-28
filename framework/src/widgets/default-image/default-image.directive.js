(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('defaultImage', defaultImage);

  defaultImage.$inject = [];

  /**
   * @namespace helion.framework.widgets.defaultImage
   * @memberof helion.framework.widgets
   * @name defaultImage
   * @description A default image directive that displays
   * a default image if the src provided doesn't exist.
   * @example
   * <img ng-src="my-bad-source.png" default-image/>
   * <img ng-src="my-bad-source.png" default-image default-image-src="my-alternative.png"/>
   * @returns {object} The default-image directive definition object
   */
  function defaultImage() {
    return {
      link: function (scope, element, attrs) {
        var defaultImageSrc = attrs.defaultImageSrc || 'images/stackato-logo-md.png';

        attrs.$observe('ngSrc', function (srcValue) {
          if (!srcValue) {
            attrs.$set('src', defaultImageSrc);
          }
        });

        element.bind('error', function () {
          attrs.$set('src', defaultImageSrc);
        });

        scope.$on('$destroy', function () {
          element.unbind('error');
        });
      },
      restrict: 'A'
    };
  }

})();
