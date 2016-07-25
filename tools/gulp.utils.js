'use strict';

var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    fsx = require('fs-extra'),
    minimatch = require('minimatch');



function handleBower(srcDir, destDir) {
	var bower_file = path.join(srcDir, 'bower.json');
	var ignore = [];
	if(fs.existsSync(bower_file)) {
		var bower_json = require(bower_file);
		_.each(bower_json.ignore, function(s) {
			ignore.push('!' + s);
		});
	}
	var files = fs.readdirSync(srcDir);
	_.each(files, function (f) {
		var srcPath = path.join(srcDir, f);
		var destPath = path.join(destDir, f);
		var meta = fs.lstatSync(srcPath);

		var shouldCopy = true;
		_.each(ignore, function(ignoreGlob) {
			shouldCopy = shouldCopy && minimatch(f, ignoreGlob);
		});
		if(shouldCopy) {
			fsx.copy(srcPath, destPath);
		}
	});
}

function copyBowerFolder(srcDir, destDir) {
	fsx.ensureDirSync(destDir);
	var files = fs.readdirSync(srcDir);
	_.each(files, function (f) {
		var srcPath = path.join(srcDir, f);
		var destPath = path.join(destDir, f);
		srcPath = fs.realpathSync(srcPath);
		var meta = fs.lstatSync(srcPath);
		if(meta.isDirectory()) {
			fsx.ensureDirSync(destPath);
			handleBower(srcPath, destPath);
		}
	});
}

module.exports.copyBowerFolder = copyBowerFolder;