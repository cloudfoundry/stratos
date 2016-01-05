(function () {
  'use strict';

  var angularModules = [
  ];

  var otherModules = [
  ];

  angular
    .module('my-webapp', [
      'app'
    ]
    .concat(angularModules)
    .concat(otherModules)
  );

})();
