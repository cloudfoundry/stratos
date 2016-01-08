(function () {
  'use strict';

  var angularModules = [
    'ngSanitize'
  ];

  var otherModules = [
    'gettext',
    'helion.framework',
    'ui.bootstrap',
    'ui.router'
  ];

  angular
    .module('green-box-ui', [
      'app'
    ]
    .concat(angularModules)
    .concat(otherModules)
  );

})();
