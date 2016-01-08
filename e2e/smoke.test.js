'use strict';

var sh = require('../tools/node_modules/shelljs');

var CMD = "/sbin/ip route|awk '/default/ { print $3 }'";
var hostIp = sh.exec(CMD, { silent: true }).output.trim();

describe('Smoke test', function () {

  it('should have a title', function () {
    browser.get('http://' + hostIp);
    expect(browser.getTitle()).toEqual('');
  });

});

