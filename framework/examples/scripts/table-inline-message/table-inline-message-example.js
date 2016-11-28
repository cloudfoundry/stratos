(function () {
  'use strict';

  angular
    .module('helionFrameworkExamples')
    .directive('tableInlineMessageExample', tableInlineMessageExample);

  tableInlineMessageExample.$inject = [
    'helionFrameworkExamples.basePath'
  ];

  function tableInlineMessageExample(path) {
    return {
      templateUrl: path + 'table-inline-message/table-inline-message-example.html'
    };
  }

})();
