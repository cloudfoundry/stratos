/* eslint-disable angular/json-functions,angular/log,no-console,no-throw-literal */
(function () {
  'use strict';

  var _ = require('../../tools/node_modules/lodash');

  module.exports = function (_module) {
    if (!_module.exports.wrap) {
      _module.exports.wrap = function (element) {
        var wrappers = {};
        _.each(_module.exports, function (value, key) {
          if (_.isFunction(value)) {
            wrappers[key] = _.partial(value, element);
          }
        });
        return wrappers;
      };
    }
  };
})();
