(function () {
  'use strict';

  describe('prettyJson  filter', function () {
    var prettyJsonFilter;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      prettyJsonFilter = $injector.get('prettyJsonFilter');
    }));

    it('should format with 2-space indentation', function () {
      var obj = {name: 'value'};
      expect(prettyJsonFilter(obj)).toBe(angular.toJson(obj, 2));
    });
  });

})();
