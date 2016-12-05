(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('showTableInlineMessage', showTableInlineMessage);

  showTableInlineMessage.$inject = [
    '$compile'
  ];

  /**
   * @namespace helion.framework.widgets.showTableInlineMessage
   * @memberof helion.framework.widgets
   * @name showTableInlineMessage
   * @description A show-table-inline-message directive
   * @param {object} $compile - the $compile service
   * @returns {object} The show-table-inline-message directive definition object
   */
  function showTableInlineMessage($compile) {
    return {
      link: link
    };

    function link(scope, element, attrs) {
      var status = attrs.tableInlineStatus ? attrs.tableInlineStatus : 'warning';
      var elem = angular.element('<tr table-inline-message status="' + status + '" message="' + attrs.showTableInlineMessage + '"></tr>');
      element.after(elem);
      $compile(elem)(scope);

      showHide(attrs.showTableInlineMessage);

      scope.$watch(
        function () {
          return attrs.showTableInlineMessage;
        },
        showHide, true
      );

      function showHide(message) {
        if (message) {
          elem.removeClass('hide-message');
        } else {
          elem.addClass('hide-message');
        }
      }
    }
  }

})();
