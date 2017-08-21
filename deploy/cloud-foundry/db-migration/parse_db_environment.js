(function () {
  'use strict';

  var args = process.argv.slice(2);
  var envFile = args[0];

  var vcapServices = process.env.VCAP_SERVICES || "{\"postgresql\":[{\"credentials\":{\"hostname\":\"10.11.241.4\",\"ports\":{\"5432\/tcp\":\"36243\"},\"port\":\"36243\",\"username\":\"vq3_Hmnb9D1d-xQd\",\"password\":\"C_QygHmMS_t9LDTT\",\"dbname\":\"u1UJ2IkKF5oFAejQ\",\"uri\":\"postgres:\/\/vq3_Hmnb9D1d-xQd:C_QygHmMS_t9LDTT@10.11.241.4:36243\/u1UJ2IkKF5oFAejQ\"},\"syslog_drain_url\":null,\"volume_mounts\":[],\"label\":\"postgresql\",\"provider\":null,\"plan\":\"v9.4-dev\",\"name\":\"ConsoleDB\",\"tags\":[\"postgresql\",\"relational\"]}]}"
  // console.log(vcapServices)
  vcapServices = JSON.parse(vcapServices);
  // console.log(vcapServices)

  var DB_TYPE, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME;
  var output = '';
  if (vcapServices.postgresql && vcapServices.postgresql.length > 0) {
    // Always use the first one
    var instance = vcapServices.postgresql[0];

    DB_TYPE = 'postgres';
    DB_HOST = instance.credentials.hostname;
    DB_PORT = instance.credentials.port;
    DB_USERNAME = instance.credentials.username;
    DB_PASSWORD = instance.credentials.password;
    DB_NAME = instance.credentials.dbname;
    // PGSQL_SSL_MODE = instance.credentials.;
  }

  if (DB_TYPE) {
    output += exportString('DB_TYPE', DB_TYPE);
    output += exportString('DB_HOST', DB_HOST);
    output += exportString('DB_PORT', DB_PORT);
    output += exportString('DB_USERNAME', DB_USERNAME);
    output += exportString('DB_PASSWORD', DB_PASSWORD);
    output += exportString('DB_NAME', DB_NAME);
  }

  var fs = require('fs');
  // console.log('Writing env file to: ', envFile);
  // console.log(output);
  fs.writeFile(envFile, output, function (err) {
    if (err) {
      return console.log(err);
    }
  });

  function exportString(name, value) {
    return '\nexport ' + name + '="' + value + '"';
  }

})();
