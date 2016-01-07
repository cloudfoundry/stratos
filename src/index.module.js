(function () {
  'use strict';

  var angularModules = [
  ];

  var otherModules = [
    'helion.framework'
  ];

  angular
    .module('green-box-ui', [
      'app'
    ]
    .concat(angularModules)
    .concat(otherModules)
  );

})();
