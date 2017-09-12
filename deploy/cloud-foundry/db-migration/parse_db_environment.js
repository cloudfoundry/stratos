(function () {
  'use strict';

  var fs = require('fs');

  var args = process.argv.slice(2);
  var envFile = args[0];
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);

  var DB_TYPE, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE_NAME, DATABASE_PROVIDER;
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
          DB_TYPE = 'postgresql';
          DATABASE_PROVIDER = 'pgsql';
          DB_HOST = serviceInstance.credentials.hostname;
          DB_PORT = serviceInstance.credentials.port;
          DB_USER = serviceInstance.credentials.username;
          DB_PASSWORD = serviceInstance.credentials.password;
          DB_DATABASE_NAME = serviceInstance.credentials.dbname;
        } else if (tag === 'stratos_mysql') {
          DB_TYPE = 'mysql';
          DATABASE_PROVIDER = 'mysql';
          DB_HOST = serviceInstance.credentials.hostname;
          DB_PORT = serviceInstance.credentials.port;
          DB_USER = serviceInstance.credentials.username;
          DB_PASSWORD = serviceInstance.credentials.password;
          DB_DATABASE_NAME = serviceInstance.credentials.name;
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
      break;
    }
  }

  if (DB_TYPE) {
    output += exportString('DATABASE_PROVIDER', DATABASE_PROVIDER);
    output += exportString('DB_TYPE', DB_TYPE);
    output += exportString('DB_HOST', DB_HOST);
    output += exportString('DB_PORT', DB_PORT);
    output += exportString('DB_USER', DB_USER);
    output += exportString('DB_PASSWORD', DB_PASSWORD);
    output += exportString('DB_DATABASE_NAME', DB_DATABASE_NAME);
  } else {
    console.error('No database configuration found in VCAP_SERVICES: ', JSON.stringify(vcapServices));
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
