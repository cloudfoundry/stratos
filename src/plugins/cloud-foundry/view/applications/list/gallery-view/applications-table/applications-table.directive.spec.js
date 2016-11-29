(function () {
  'use strict';

  describe('applications-table directive', function () {
    var $element, applicationsTableDirectiveCtrl;

    var apps = [
      {
        clusterId: 'testGuid',
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
      var markup = '<applications-table apps="apps"></applications-table>';

      $element = angular.element(markup);
      $compile($element)($scope);
      $scope.$apply();

      applicationsTableDirectiveCtrl = $element.controller('applicationsTable');
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    describe('Controller tests', function () {
      it('should be defined', function () {
        expect(applicationsTableDirectiveCtrl).toBeDefined();
      });

      it('should return correct URL', function () {
        var urlString = applicationsTableDirectiveCtrl.getAppSummaryLink(apps[0]);
        expect(urlString).toEqual('#/cf/applications/testGuid/app/appGuid/summary');
      });

    });

  });

})();
