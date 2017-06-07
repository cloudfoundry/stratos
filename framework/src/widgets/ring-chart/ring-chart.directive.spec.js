(function () {
  'use strict';

  describe('ring-chart directive', function () {
    var $compile, mockData, mockLabels;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');

      mockData = {
        ok: 5,
        critical: 2,
        warning: 3,
        unknown: 6
      };

      mockLabels = {
        ok: 'OK',
        critical: 'Errors',
        warning: 'Warnings',
        unknown: 'Unknown',
        total: 'Items',
        totalOne: 'Item'
      };
    }));

    describe('without data', function () {
      var contextScope, element, ringChartCtrl;

      beforeEach(inject(function ($injector) {
        contextScope = $injector.get('$rootScope').$new();
        var markup = '<ring-chart></ring-chart>';
        element = angular.element(markup);
        $compile(element)(contextScope);
        contextScope.$apply();
        ringChartCtrl = element.controller('ringChart');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
        expect(ringChartCtrl).toBeDefined();
      });
    });

    describe('with data', function () {
      var contextScope, element, ringChartCtrl;

      beforeEach(inject(function ($injector) {
        contextScope = $injector.get('$rootScope').$new();
        contextScope.mockData = mockData;
        contextScope.mockLabels = mockLabels;

        var markup = '<ring-chart data="mockData" labels="mockLabels"></ring-chart>';
        element = angular.element(markup);
        $compile(element)(contextScope);

        contextScope.$apply();
        ringChartCtrl = element.controller('ringChart');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
        expect(ringChartCtrl).toBeDefined();
      });

    });
  });

})();
