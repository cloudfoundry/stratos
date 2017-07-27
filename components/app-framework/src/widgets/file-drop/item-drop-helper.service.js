(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .factory('itemDropHelper', itemDropHelper);

  function itemDropHelper($q, gitIgnoreParser) {

    var archiveRegex = /\.(tar|zip|tar.gz)$/i;

    return {
      identify: identify,
      traverseFiles: traverseFiles,
      isArchiveFile: isArchiveFile,
      initScanner: initScanner,
      readFileContents: readFileContents
    };

    function isArchiveFile(name) {
      return archiveRegex.test(name);
    }

    /**
     * @name identify
     * @description Identify what has been dropped
     * @param {object} items - items object from a drop event
     * @returns {object} metadata about the dropped item(s)
     */
    function identify(items) {
      var p = $q.defer();
      var result = {
        isWebLink: false,
        isArchiveFile: false,
        isFiles: false,
        value: undefined
      };

      // Check single file item
      if (items.length === 1 && items[0].kind === 'file') {
        var fileEntry = items[0].webkitGetAsEntry();
        if (fileEntry.isFile) {
          // Check extension
          if (isArchiveFile(fileEntry.name)) {
            result.isArchiveFile = true;
            fileEntry.file(function (file) {
              result.value = file;
              p.resolve(result);
            }, function (fileError) {
              p.reject(fileError);
            });
            return p.promise;
          }
        } else if (fileEntry.isDirectory) {
          result.isFiles = true;
          result.value = fileEntry;
        }

        p.resolve(result);
        return p.promise;
      }

      // Go through the items seeing if we can find one that is a link
      var linkItem;
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind === 'string' && (items[i].type === 'text/uri-list' || items[i].type === 'text/plain')) {
          linkItem = items[i];
          break;
        }
      }

      if (linkItem) {
        linkItem.getAsString(function (url) {
          result.isWebLink = true;
          result.value = url;
          p.resolve(result);
        });
        return p.promise;
      }

      // Not supported
      p.resolve(result);
      return p.promise;
    }

    function traverseFiles(item, ignoresFile, defaultIgnores) {
      var scanner = initScanner();
      var p = $q.defer();
      findIgnoreFile(scanner, item, ignoresFile, defaultIgnores).then(function () {
        return traverseFileTree(scanner, scanner.root, item, '', 0).then(function () {
          p.resolve(scanner);
        });
      });

      return p.promise;
    }

    function traverseFileTree(scanner, context, item, path, level) {
      if (item.isFile) {
        return readFile(scanner, context, item, path);
      } else if (item.isDirectory) {
        // Ignore hidden folders
        if (item.name.indexOf('.') === 0) {
          return $q.resolve();
        } else {
          // Get folder contents
          var dirReader = item.createReader();
          var p = $q.defer();
          var subPath = level === 0 ? '' : path + '/' + item.name;
          var newContext = level === 0 ? context : scanner.folder(context, item.name, subPath);
          if (!newContext) {
            p.resolve();
          } else {
            dirReader.readEntries(function (entries) {
              var chain = [];
              for (var i = 0; i < entries.length; i++) {
                chain.push(traverseFileTree(scanner, newContext, entries[i], subPath, level + 1));
              }
              $q.all(chain).then(function () {
                p.resolve();
              }).catch(function () {
                p.reject();
              });
            });
          }
          return p.promise;
        }
      } else {
        return $q.resolve();
      }
    }

    function readFile(scanner, context, item, path) {
      var p = $q.defer();
      // Get file
      item.file(function (file) {
        scanner.file(context, file, path);
        p.resolve();
      }, function (fileErr) {
        p.reject(fileErr);
      });
      return p.promise;
    }

    // Scanner keeps track of files and folders as we discover them
    function initScanner(ignores) {
      var scanner = {
        total: 0,
        files: 0,
        folders: 0,
        excludes: [],
        root: {
          files: [],
          folders: {}
        },

        file: function (context, file, path) {
          var fullName = path + '/' + file.name;
          if (fullName.indexOf('/') === 0) {
            fullName = fullName.substr(1);
          }
          var skip = scanner.filter ? !scanner.filter.accepts(fullName) : false;
          if (!skip) {
            scanner.files++;
            scanner.total += file.size;
            context.files.push(file);
          } else {
            scanner.excludes.push(fullName);
          }
        },

        folder: function (context, name, fullName) {
          if (context.folders[name]) {
            return context.folders[name];
          }

          if (fullName.indexOf('/') === 0) {
            fullName = fullName.substr(1);
          }
          fullName += '/';
          if (scanner.filter && !scanner.filter.accepts(fullName)) {
            scanner.excludes.push(fullName);
            return undefined;
          }
          scanner.folders++;
          var newContext = {
            folders: {},
            files: []
          };
          context.folders[name] = newContext;
          return newContext;
        },

        addFile: function (file) {
          // Make the folder for the file
          var fileParts = file.webkitRelativePath.split('/');
          var context = scanner.root;
          var fullPath = '';
          if (fileParts.length > 1) {
            for (var i = 0; i < fileParts.length - 1; i++) {
              if (!(scanner.rootFolderName && i === 0 && fileParts[i] === scanner.rootFolderName)) {
                fullPath += '/' + fileParts[i];
                context = scanner.folder(context, fileParts[i], fullPath);
                if (!context) {
                  // Ignored folder
                  return scanner;
                }
              }
            }
          }
          scanner.file(context, file, fullPath);
          return scanner;
        }
      };

      if (ignores) {
        scanner.filter = gitIgnoreParser.compile(ignores);
      }
      return scanner;
    }

    /*
     * Try and find the ignore file
     */

    function findIgnoreFile(scanner, item, fileName, defaultIgnores) {
      var p = $q.defer();
      if (item.isDirectory && fileName) {
        var dirReader = item.createReader();
        dirReader.readEntries(function (entries) {
          var chain = [];
          for (var i = 0; i < entries.length; i++) {
            var childItem = entries[i];
            if (childItem.isFile && childItem.name === fileName) {
              chain.push(readItemContents(childItem).then(function (data) {
                scanner.filter = gitIgnoreParser.compile(defaultIgnores + data);
                scanner.foundIgnoreFile = true;
              }));
            }
          }
          $q.all(chain).then(function () {
            p.resolve();
          }).catch(function () {
            p.reject();
          });
        });
      } else {
        p.resolve();
      }
      return p.promise;
    }

    function readItemContents(item) {
      var p = $q.defer();
      item.file(function (file) {
        readFileContents(file).then(function (data) {
          p.resolve(data);
        }).catch(function () {
          p.reject();
        });
      });
      return p.promise;
    }

    function readFileContents(file) {
      var p = $q.defer();
      var reader = new FileReader();
      reader.onload = function (e) {
        var output = e.target.result;
        p.resolve(output);
      };
      reader.onerror = function () {
        p.reject();
      };
      reader.onabort = function () {
        p.reject();
      };
      reader.readAsText(file);
      return p.promise;
    }
  }
})();
