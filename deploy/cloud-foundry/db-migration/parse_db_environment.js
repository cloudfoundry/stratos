(function () {
  'use strict';

  var fs = require('fs');

  var args = process.argv.slice(2);
  var envFile = args[0];
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);

  var DB_TYPE, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME;
  var output = '';

  // Discover the db by finding the first service instance with a supported type
  for (var serviceKey in vcapServices) {
    if (!vcapServices.hasOwnProperty(serviceKey)) {
      continue;
    }
    var serviceInstances = vcapServices[serviceKey];

    for (var i = 0; i < serviceInstances.length; i++) {
      var serviceInstance = serviceInstances[i];
      if (!serviceInstance.tags || serviceInstance.tags.length === 0) {
        continue;
      }

      for (var y = 0; y < serviceInstance.tags.length; y++) {
        var tag = serviceInstance.tags[y];
        if (tag === 'stratos_postgresql') {
          var instance = vcapServices.postgresql[0];

          DB_TYPE = 'postgresql';
          DB_HOST = instance.credentials.hostname;
          DB_PORT = instance.credentials.port;
          DB_USERNAME = instance.credentials.username;
          DB_PASSWORD = instance.credentials.password;
          DB_NAME = instance.credentials.dbname;
        }
      }
      if (DB_TYPE) {
        break;
      }
    }
    if (DB_TYPE) {
      break;
    }
  }

  if (DB_TYPE) {
    output += exportString('DB_TYPE', DB_TYPE);
    output += exportString('DB_HOST', DB_HOST);
    output += exportString('DB_PORT', DB_PORT);
    output += exportString('DB_USERNAME', DB_USERNAME);
    output += exportString('DB_PASSWORD', DB_PASSWORD);
    output += exportString('DB_NAME', DB_NAME);
  }

  fs.writeFile(envFile, output, function (err) {
    if (err) {
      return console.log(err);
    }
  });

  function exportString(name, value) {
    return '\nexport ' + name + '="' + value + '"';
  }

})();
