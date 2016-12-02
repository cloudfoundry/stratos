(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('svgImage', svgImage);

  svgImage.$inject = [ '$http' ];

  function svgImage($http) {
    return {
      restrict: 'E',
      link: function (scope, element, attrs) {
        $http.get(attrs.src, {cache: true}).success(function (data) {
          var svg = angular.element(data);
          for (var i = svg.length - 1; i >= 0; i--) {
            if (svg[i].constructor.name === 'SVGSVGElement') {
              svg = angular.element(svg[i]);
              break;
            }
          }

          for (var attr in attrs) {
            if (!attrs.hasOwnProperty(attr) || attr[0] === '$') {
              continue;
            }
            svg.attr(attr, attrs[attr]);
          }

          svg = svg.removeAttr('xmlns:a');
          element.replaceWith(svg);

          scope.$on('$destroy', function () {
            svg.remove();
          });
        });
      }
    };
  }
})();
