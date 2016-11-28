(function () {
  'use strict';

  // The filters
  angular.module('helion.framework.filters')
    .filter('byProperties', byProperties);

  byProperties.$inject = [
    '$filter'
  ];

  /**
   * @namespace helion.framework.filters.byProperties
   * @memberof helion.framework.filters
   * @name byProperties
   * @description An angular filter which will take a collection of objects and filter over only those properties
   * supplied. Properties that are not supplied will be ignored
   * @param {object} $filter - Angular $filter service
   * @returns {Function} The filter itself
   */
  function byProperties($filter) {
    /**
     * @param {array} items Collection of objects to search over.
     * @param {object} searchValue Object to find in collection's items. This may be of any type.
     * @param {array} searchProperties Collection of strings that relate to properties of objects in the collection.
     * Only these properties will be used when searching for the object to find.
     * @returns {array} Collection of objects that contain the searchValue for at least one of the properties supplied
     */
    return function (items, searchValue, searchProperties) {
      // No search value provided... return all items
      if (searchValue === null || angular.isUndefined(searchValue) || searchValue === '') {
        return items;
      }
      // No properties to search over... return no items
      if (!searchProperties || searchProperties.length === 0) {
        return [];
      }

      // Loop through each item in the collection
      var result = [];
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        // Inspect the supplied properties of the object
        for (var j = 0; j < searchProperties.length; j++) {
          // Use the same method as filter to determine if this property's value matches that of search item
          var expression = _.set({}, searchProperties[j], searchValue);
          if ($filter('filter')([item], expression).length > 0) {
            // If found, add item to result collection
            result.push(item);
            break;
          }
        }
      }

      // Return the collection of all objects that contain the search item
      return result;
    };
  }

})();
