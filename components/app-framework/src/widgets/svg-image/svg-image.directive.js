(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('svgImage', svgImage);

  function svgImage($templateRequest, $compile) {
    return {
      restrict: 'E',
      link: function (scope, element, attrs) {
        $templateRequest(attrs.src).then(function (data) {
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
            var attrName = attrs.$attr[attr];
            if (attrName !== 'ng-if') {
              svg.attr(attrName, attrs[attr]);
            }
          }

          svg = svg.removeAttr('xmlns:a');
          element.replaceWith($compile(svg)(scope));

          scope.$on('$destroy', function () {
            svg.remove();
          });
        });
      }
    };
  }
})();
