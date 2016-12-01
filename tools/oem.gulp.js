/* eslint-disable angular/log,no-console,no-process-env,no-sync */
(function () {
  'use strict';

  // Gulp tasks to support OEM

  var config, paths;

  module.exports = function (c) {
    config = c;
    paths = config.paths;
  };

  var gulp = require('gulp');
  var gutil = require('gulp-util');
  var fs = require('fs');
  var path = require('path');
  var fsx = require('fs-extra');
  var del = require('delete');
  var endOfLine = require('os').EOL;
  var index = 1;

  var importRegEx = /^@import ["'](.*)["']/i;
  var importSplitRegEx = /["'](.*)["']/i;

  function findFile(seen, base, importFile) {
    var file = path.resolve(base, importFile);
    var partial = false;
    var outName = path.basename(importFile);
    if (path.extname(file) !== '.scss') {
      file = file + '.scss';
      outName = outName + '.scss';
    }
    if (!fs.existsSync(file)) {
      file = path.join(path.dirname(file), '_' + path.basename(file));
      partial = true; 
      if (!fs.existsSync(file)) {
        throw new gutil.PluginError({
          plugin: 'oem',
          message: 'Can not find file:' + scssFile
        });
      }
    }

    if (seen[file]) {
      return {
        outName: seen[file],
        done: true
      };
    } else {
      if (partial) {
        outName = '_' + index + '_' + outName;
      } else {
        outName = index + '_' + outName;
      }
      index = index + 1;
      seen[file] = outName;
      return {
        file: file,
        outName: outName,
        partial: partial,
        done: false
      };
    }
  }

  function processFile(seen, scssFile, outputFile) {
    var outputFolder = path.dirname(outputFile);
    fs.writeFileSync(outputFile, '', 'utf8');
    var splitImport = false;
    var base = path.dirname(scssFile);
    var lines = fs.readFileSync(scssFile, 'utf8').toString().split('\n');
    lines.forEach(function (line, i) {
      var tline = line.trim();
      var found = false;
      if (splitImport) {
        found = tline.match(importSplitRegEx);
      } else {
        found = tline.match(importRegEx);
      }
      if (found && found.length > 1) {
        splitImport = tline.indexOf(';') === -1;
        var importFile = found[1];
        var meta = findFile(seen, base, importFile);
        fs.appendFileSync(outputFile, '@import \"' + meta.outName + '\";' + endOfLine);
        if (!meta.done) {
          processFile(seen, meta.file, path.join(outputFolder, meta.outName));
        }
      } else {
        if (!(i === lines.length - 1 && tline.length === 0)) {
          fs.appendFileSync(outputFile, line.toString() + endOfLine);
        }
      }
    });
  }

  gulp.task('oem:clean', function (next) {
    del(paths.oem + 'scss/*', {force: true}, next);
  });

  // Copy files that will be needed at OEM time
  gulp.task('oem:files', function () {
    return gulp
      .src([
        paths.src + 'index.html',
        paths.dist + 'stackato-config.js'
      ])
      .pipe(gulp.dest(paths.oem + 'dist'));
  });

  gulp.task('oem', ['oem:clean', 'oem:files'], function (done) {
    var file = paths.src + 'index_oem.scss';
    var outputFile = paths.oem + 'dist/scss/index.scss';
    fsx.ensureDirSync(path.dirname(outputFile));
    processFile({}, file, outputFile);
    done();
  });

})();
