(function () {
  'use strict';

  describe('app details - log-stream view', function () {
    var $httpBackend, logViewerCtrl;

    var webSocketUrl = 'wss://socketmcsocketface';

    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var $stateParams = $injector.get('$stateParams');
      var $scope = $injector.get('$rootScope').$new();
      var $compile = $injector.get('$compile');
      var markup = '<cf-log-viewer web-socket-url="webSocketUrl"></cf-log-viewer>';
      var $element = angular.element(markup);
      $scope.webSocketUrl = webSocketUrl;
      $compile($element)($scope);
      $scope.$apply();
      logViewerCtrl = $element.controller('cf-log-viewer');

      $stateParams.guid = 'appGuid';
      $stateParams.cnsiGuid = 'cnsiGuid';

    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have controller defined', function () {
      expect(logViewerCtrl).toBeDefined();
      expect(logViewerCtrl.autoScrollOn).toBe(true);
      expect(logViewerCtrl.webSocketUrl).toEqual(webSocketUrl);
    });

    function formatTimeStamp(epoch) {
      var d = moment(Math.round(epoch / 1000000));
      return d.format('HH:mm:ss.SSS');
    }

    it('should correctly parse APP messages', function () {
      var yellow = '\x1B[1;32m';
      var reset = '\x1B[0m';

      var jsonMessage = '{"message":"UGFydHkgY2FyIGNoYXJhY3RlciBzdWRkZW5seSBjaGFpciBsYXJnZSBwYXJ0eSBtZWF0","message_type":1,"timestamp":1477324858341484766,"app_id":"d87c4e68-a486-443f-b83e-fc9536f8478f","source_type":"APP","source_instance":"0"}';
      var filtered = logViewerCtrl.jsonFilter(jsonMessage);

      // Message date should be blue
      var expected = formatTimeStamp(1477324858341484766) + ': ';

      // Message source should be yellow
      expected += yellow + '[APP.0]' + reset;

      // Message should be default colour
      expected += ' Party car character suddenly chair large party meat\n';
      expect(filtered).toBe(expected);
    });

    it('should correctly parse CELL messages', function () {
      var yellow = '\x1B[1;33m';
      var reset = '\x1B[0m';

      var jsonMessage = '{"message":"U3VjY2Vzc2Z1bGx5IGRlc3Ryb3llZCBjb250YWluZXI=","message_type":1,"timestamp":1477325893418618476,"app_id":"d87c4e68-a486-443f-b83e-fc9536f8478f","source_type":"CELL","source_instance":"0"}';
      var filtered = logViewerCtrl.jsonFilter(jsonMessage);

      // Message date should be blue
      var expected = formatTimeStamp(1477325893418618476) + ': ';

      // Message source should be red
      expected += yellow + '[CELL.0]' + reset;

      // Message should be default colour
      expected += ' Successfully destroyed container\n';

      expect(filtered).toBe(expected);
    });

    it('should return passed string if non json', function () {
      var jsonMessage = 'Invalid JSON ... {message:"0"}';
      var filtered = logViewerCtrl.jsonFilter(jsonMessage);
      expect(filtered).toBe(jsonMessage);
    });

  });

})();
