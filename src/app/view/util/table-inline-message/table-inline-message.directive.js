(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('tableInlineMessage', tableInlineMessage);

  tableInlineMessage.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.table-inline-message
   * @memberof app.view
   * @name table-inline-message
   * @description A table-inline-message directive
   * @param {string} path - the application base path
   * @returns {object} The table-inline-message directive definition object
   */
  function tableInlineMessage(path) {
    return {
      bindToController: {
        message: '@'
      },
      controller: function () {},
      controllerAs: 'tableInlineMessageCtrl',
      scope: {},
      templateUrl: path + 'view/util/table-inline-message/table-inline-message.html'
    };
  }

})();
