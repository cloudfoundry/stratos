(function () {
  'use strict';

  angular
    .module('service-manager.utils', [])
    .factory('service-manager.utils.version', versionUtilsServiceFactory);

  versionUtilsServiceFactory.$inject = [
  ];

  function versionUtilsServiceFactory() {
    return {
      sort: sort,
      sortByProperty: sortByProperty,
      compare: compare,
      parse: parse
    };
  }

  function parse(versionString) {
    var parts = versionString.split('-');
    var versionParts = parts[0].split('.');
    return {
      major: versionParts.length > 0 ? parseInt(versionParts[0], 10) : undefined,
      minor: versionParts.length > 1 ? parseInt(versionParts[1], 10) : undefined,
      revision: versionParts.length > 2 ? parseInt(versionParts[2], 10) : undefined,
      tag: parts.length > 1 ? parts[1] : undefined
    };
  }

  function compare(v1s, v2s) {
    var v1 = parse(v1s);
    var v2 = parse(v2s);
    if (v1.major === v2.major) {
      if (v1.minor === v2.minor) {
        if (v1.revision === v2.revision) {
          return 0;
        } else {
          return v1.revision > v2.revision ? 1 : -1;
        }
      } else {
        return v1.minor > v2.minor ? 1 : -1;
      }
    } else {
      return v1.major > v2.major ? 1 : -1;
    }
  }

  function compareReverse(v1, v2) {
    var res = compare(v1, v2);
    if (res === 0) {
      return res;
    } else {
      return res === 1 ? -1 : 1;
    }
  }

  function compareByProperty(property, reverse) {
    if (!reverse) {
      return function (v1, v2) {
        return compare(v1[property], v2[property]);
      };
    } else {
      return function (v1, v2) {
        return compareReverse(v1[property], v2[property]);
      };
    }
  }

  function sort(array) {
    return array.sort(compare);
  }

  function sortByProperty(array, property, reverse) {
    return array.sort(compareByProperty(property, reverse));
  }

})();
