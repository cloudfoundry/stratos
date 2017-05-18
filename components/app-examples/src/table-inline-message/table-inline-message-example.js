(function () {
  'use strict';

  angular
    .module('app-examples.widgets')
    .directive('tableInlineMessageExample', tableInlineMessageExample);

  function tableInlineMessageExample() {
    return {
      templateUrl: '/app-examples/table-inline-message/table-inline-message-example.html'
    };
  }

})();
