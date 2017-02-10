/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  // through2 is a thin wrapper around node transform streams
  var through = require('through2');
  var gutil = require('gulp-util');
  var _ = require('lodash');
  var path = require('path');

  // Consts
  var PLUGIN_NAME = 'gulp-i18n';

  //var REPLACE_REGEX = /\[\[:@(.*)]]/g;
  var REPLACE_REGEX = /\[\[(@:.*?)\]\]/g;

  module.exports = function (prettyPrint) {
    // Translations
    var translations = {};
    var firstFiles = {};

    function replace(obj, current) {
      _.each(current, function (v, k) {
        if (_.isObject(v)) {
          replace(obj, v);
        } else {
          // Should be simple key -> value
          var productKeys = v.match(REPLACE_REGEX);
          if (productKeys && productKeys.length) {
            _.each(productKeys, function (r) {
              var i18nKey = r.substr(4);
              i18nKey = i18nKey.substr(0, i18nKey.length - 2);
              v = v.replace(r, _.get(obj, i18nKey));
              current[k] = v;
            });
          }
        }
      });
    }

    function endStream(cb) {
      var that = this;

      if (Object.keys(firstFiles).length === 0) {
        return cb();
      }
      _.each(translations, function (v, locale) {
        replace(v, v);
        var res = prettyPrint ? JSON.stringify(v, undefined, 2) : JSON.stringify(v);
        var file = new gutil.File({
          cwd: firstFiles[locale].cwd,
          base: firstFiles[locale].base,
          path: path.join(firstFiles[locale].base, 'locale-' + locale + '.json'),
          contents: new Buffer(res)
        });

       // console.log(res);
        that.push(file);
      });

      cb();
    }

    function addStrings(locale, file) {
      if (!translations[locale]) {
        translations[locale] = {};
        firstFiles[locale] = file;
      }
      var json = JSON.parse(file.contents.toString());
      _.defaultsDeep(translations[locale], json);
    }

    function bufferContents(file, enc, cb) {
      // ignore empty files
      if (file.isNull()) {
        return cb(file);
      }

      if (file.isStream()) {
        return cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
      }

      var locale = file.relative.substr(0, 2);
      addStrings(locale, file);
      cb();
    }

    // Exporting the plugin main function
    return through.obj(bufferContents, endStream);
  };
})();
