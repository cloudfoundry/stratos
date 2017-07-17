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

  module.exports = function (prettyPrint, initJsonAllLocales) {
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
              v = v.replace(r, resolveKey(obj, i18nKey));
              current[k] = v;
            });
          }
        }
      });
    }

    function resolveKey(obj, key) {
      var value = _.get(obj, key);
      if (!value) {
        throw new gutil.PluginError(PLUGIN_NAME, ' Missing string: ' + key);
      }
      if (value.indexOf('@:') === 0) {
        return resolveKey(obj, value.substr(2));
      }
      return value;
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
        translations[locale] = _.cloneDeep(initJsonAllLocales || {});
        firstFiles[locale] = file;
      }
      var json = JSON.parse(file.contents.toString());
      var existing = translations[locale];
      merge(existing, json);
    }

    function merge(dest, src) {
      _.each(src, function (v, k) {
        //console.log(k);
        if (!_.isUndefined(dest[k])) {
          if (_.isString(v) && _.isObject(dest[k])) {
            // Need to check if dest[k][k] exists
            dest[k][k] = v;
          } else if (_.isObject(v) && _.isString(dest[k])) {
            v[k] = dest[k];
            dest[k] = v;
          } else {
            if (_.isString(v)) {
              if (_.isUndefined(dest[k])) {
                dest[k] = v;
              }
            } else {
             // Merge again
              merge(dest[k], v);
            }
          }
        } else {
          dest[k] = v;
        }
      });
    }

    function bufferContents(file, enc, cb) {

      // ignore empty files
      if (file.isNull()) {
        return cb(file);
      }

      if (file.isStream()) {
        return cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
      }

      var locale = path.dirname(file.relative);
      addStrings(locale, file);
      cb();
    }

    // Exporting the plugin main function
    return through.obj(bufferContents, endStream);
  };
})();

