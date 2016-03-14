(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('showTableInlineMessage', showTableInlineMessage);

  showTableInlineMessage.$inject = [
    '$compile'
  ];

  /**
   * @namespace app.view.show-table-inline-message
   * @memberof app.view
   * @name show-table-inline-message
   * @description A show-table-inline-message directive
   * @param {object} $compile - the $compile service
   * @returns {object} The show-table-inline-message directive definition object
   */
  function showTableInlineMessage($compile) {
    return {
      link: link
    };

    function link(scope, element, attrs) {
      var msg = attrs.showTableInlineMessage;
      if (!msg) {
        return;
      }
      var ele = angular.element('<tr table-inline-message message="' + msg + '"></tr>');
      element.after(ele);
      $compile(ele)(scope);
    }
  }

})();
