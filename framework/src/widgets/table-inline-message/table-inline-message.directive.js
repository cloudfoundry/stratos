(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('tableInlineMessage', tableInlineMessage);

  tableInlineMessage.$inject = [
    'helion.framework.basePath'
  ];

  /**
   * @namespace helion.framework.widgets.tableInlineMessage
   * @memberof helion.framework.widgets
   * @name tableInlineMessage
   * @description A table-inline-message directive
   * @param {string} path - the application base path
   * @returns {object} The table-inline-message directive definition object
   */
  function tableInlineMessage(path) {
    return {
      bindToController: {
        message: '@',
        status: '@',
        colSpan: '@?'
      },
      controller: function () {
        this.statusClass = 'hpe-popover-alert-' + (this.status ? this.status : 'warning');
      },
      controllerAs: 'tableInlineMessageCtrl',
      scope: {},
      templateUrl: path + 'widgets/table-inline-message/table-inline-message.html'
    };
  }

})();
