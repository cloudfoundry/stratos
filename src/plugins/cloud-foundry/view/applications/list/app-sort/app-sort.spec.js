(function () {
  'use strict';

  describe('app-sort directive', function () {
    var $element, appSortCtrl;

    var apps = [
      {
        clusterId: 'testGuid',
        entity: {
          name: '1'
        },
        metadata: {
          guid: 'appGuid'
        }
      },
      {
        clusterId: 'testGuid',
        entity: {
          name: '2'
        },
        metadata: {
          guid: 'appGuid'
        }
      }
    ];

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();
      $scope.apps = apps;
      var markup = '<applications-sorting></applications-sorting>';

      $element = angular.element(markup);
      $compile($element)($scope);
      $scope.$apply();

      appSortCtrl = $element.controller('applicationsSorting');
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    describe('Controller tests', function () {
      it('should be defined', function () {
        expect(appSortCtrl).toBeDefined();
      });

    });

  });

})();
