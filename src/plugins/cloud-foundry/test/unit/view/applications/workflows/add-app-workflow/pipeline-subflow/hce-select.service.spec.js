(function () {
  'use strict';

  describe('HceSelectController', function () {
    var hceSelectController, $uibModalInstance, hceCnsis;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {

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

      var context = {
        hceCnsis: hceCnsis
      };

      $uibModalInstance = {
        close: angular.noop,
        dismiss: angular.noop
      };
      var $controller = $injector.get('$controller');
      hceSelectController = $controller('HceSelectController', {
        $uibModalInstance: $uibModalInstance,
        context: context
      });

      spyOn($uibModalInstance, 'dismiss').and.callThrough();
    }));

    it('should be defined', function () {
      expect(hceSelectController).toBeDefined();
    });

    it('should return name when `getName` is invoked', function () {
      var name = hceSelectController.getName(hceCnsis[0]);
      expect(name).toEqual(hceCnsis[0].name);
    });

    it('should return endpoint when `endpoint` is invoked', function () {
      var endpoint = hceSelectController.getEndpoint(hceCnsis[0]);
      expect(endpoint).toEqual('https://hce.helion.space');
    });

    it('should resolve result selected HCE Instance', function () {
      hceSelectController.hceCnsi = hceCnsis[0];
      $uibModalInstance.close = function (hce) {
        expect(hce).toEqual(hceCnsis[0]);
      };
      hceSelectController.selectHce();
    });

    it('should call dimiss when cancel is invoked', function () {
      hceSelectController.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalled();
    });

  });
})();
