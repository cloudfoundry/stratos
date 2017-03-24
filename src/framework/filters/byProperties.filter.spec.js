(function () {
  'use strict';

  describe('Filter: byPropeties', function () {
    var byPropertiesFilter;

    beforeEach(module('helion.framework.filters'));
    beforeEach(inject(function (_byPropertiesFilter_) {
      byPropertiesFilter = _byPropertiesFilter_;
    }));

    describe('basic collection', function () {
      var colIn, searchValue;

      beforeEach(function () {
        colIn = [{propOne: '1'}, {propTwo: '1'}];
        searchValue = '1';
      });

      it('should match first object', function () {
        var searchProperties = ['propOne'];
        var colOut = [{propOne: '1'}];
        expect(byPropertiesFilter(colIn, searchValue, searchProperties)).toEqual(colOut);
      });

      it('should match second object', function () {
        var searchProperties = ['propTwo'];
        var colOut = [{propTwo: '1'}];
        expect(byPropertiesFilter(colIn, searchValue, searchProperties)).toEqual(colOut);
      });

      it('should match no object when properties are missing', function () {
        var searchProperties = [];
        var colOut = [];
        expect(byPropertiesFilter(colIn, searchValue, searchProperties)).toEqual(colOut);
      });

      it('should match all objects when no search value', function () {
        var searchProperties = ['propOne'];
        searchValue = null;
        expect(byPropertiesFilter(colIn, searchValue, searchProperties)).toEqual(colIn);
      });
    });
  });
})();
