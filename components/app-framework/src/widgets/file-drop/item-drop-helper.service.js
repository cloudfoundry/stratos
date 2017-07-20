(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .factory('itemDropHelper', itemDropHelper);

  function itemDropHelper($q, cfIgnoreParser) {

    var archiveRegex = /\.(tar|zip|tar.gz)$/i;

    return {
      identify: identify,
      traverseFiles: traverseFiles,
      isArchiveFile: isArchiveFile,
      initScanner: initScanner
    };

    function isArchiveFile(name) {
      return archiveRegex.test(name);
    }

    /**
     * @description Identify what has been dropped
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
            result.value = fileEntry;
          }
        } else if (fileEntry.isDirectory) {
          result.isFiles = true;
          result.value = fileEntry;
        }

        p.resolve(result);
        return p.promise;
      }

      for (var i = 0; i < items.length; i++) {
        if (items[i].kind === 'string' && items[i].type === 'text/uri-list') {
          items[i].getAsString(function (url) {
            result.isWebLink = true;
            result.value = url;
            p.resolve(result);
          });
          return p.promise;
        }
      }

      // Not supported
      p.resolve(result);
      return p.promise;
    }

    function traverseFiles(item, ignoresFile) {
      var scanner = initScanner();
      var p = $q.defer();
      findIgnoreFile(scanner, item, ignoresFile).then(function () {
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
      });
      return p.promise;
    }

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
        scanner.filter = cfIgnoreParser.compile(ignores);
      }
      return scanner;
    }

    function findIgnoreFile(scanner, item, fileName) {
      var p = $q.defer();
      if (item.isDirectory && fileName) {
        var dirReader = item.createReader();
        dirReader.readEntries(function (entries) {
          var chain = [];
          for (var i = 0; i < entries.length; i++) {
            var childItem = entries[i];
            if (childItem.isFile && childItem.name === fileName) {
              chain.push(readItemContents(childItem).then(function (data) {
                scanner.filter = cfIgnoreParser.compile(data);
              }));
            }
          }
          $q.all(chain).then(function () {
            p.resolve();
          });
        });
      } else {
        p.resolve();
      }
      return p.promise;
    }

    function readItemContents(item) {
      var p = $q.defer();
      var reader = new FileReader();
      reader.onload = function (e) {
        var output = e.target.result;
        p.resolve(output);
      };
      item.file(function (file) {
        reader.readAsText(file);
      });
      return p.promise;
    }
  }
})();
