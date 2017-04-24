(function () {
  'use strict';

  describe('code-engine-info directive', function () {
    var $compile, $scope, hceCnsis;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();

      hceCnsis = [
        {
          name: 'testHCE',
          api_endpoint: {
            Scheme: 'https',
            Host: 'hce.helion.space'
          }
        },
        {
          name: 'hceTest',
          api_endpoint: {
            Scheme: 'https',
            Host: 'hce.helion.space'
          }
        }
      ];
    }));

    describe('general tests', function () {
      var element, codeEngineInfoCtrl;

      beforeEach(function () {
        var markup = '<code-engine-info  hce="hce" hce-cnsis="hceCnsis"><code-engine-info/>';

        $scope.hce = null;
        $scope.hceCnsis = hceCnsis;
        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        codeEngineInfoCtrl = element.controller('codeEngineInfo');
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have `hce` property initially set to first element of hceCnsis', function () {
        expect(codeEngineInfoCtrl.hce).toEqual(hceCnsis[0]);
      });

      it('should return name when `getName` is invoked', function () {
        var name = codeEngineInfoCtrl.getName();
        expect(name).toEqual(hceCnsis[0].name);
      });

      it('should return endpoint when `endpoint` is invoked', function () {
        var endpoint = codeEngineInfoCtrl.getEndpoint();
        expect(endpoint).toEqual('https://hce.helion.space');
      });

    });

  });

})();
