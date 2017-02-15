(function () {
  'use strict';

  describe('app details - log-stream view', function () {
    var $httpBackend, appLogStreamController;

    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      var utils = $injector.get('app.utils.utilsService');
      var $stateParams = $injector.get('$stateParams');
      var $location = $injector.get('$location');
      var $log = $injector.get('$log');
      var base64 = $injector.get('base64');
      var $state = $injector.get('$state');

      $stateParams.guid = 'appGuid';
      $stateParams.cnsiGuid = 'cnsiGuid';

      var ApplicationLogStreamController = $state.get('cf.applications.application.log-stream').controller;
      appLogStreamController = new ApplicationLogStreamController(base64, modelManager, utils, $stateParams, $location, $log);
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have controller defined', function () {
      expect(appLogStreamController).toBeDefined();
      expect(appLogStreamController.jsonFilter).toBeDefined();
      expect(appLogStreamController.autoScroll).toBeDefined();
    });

    it('should have valid WebsocketUrl', function () {
      expect(appLogStreamController.websocketUrl).toBe('ws://server:80/pp/v1/cnsiGuid/apps/appGuid/stream');
    });

    it('should correctly parse APP messages', function () {
      var yellow = '\x1B[1;32m';
      var reset = '\x1B[0m';

      var jsonMessage = '{"message":"UGFydHkgY2FyIGNoYXJhY3RlciBzdWRkZW5seSBjaGFpciBsYXJnZSBwYXJ0eSBtZWF0","message_type":1,"timestamp":1477324858341484766,"app_id":"d87c4e68-a486-443f-b83e-fc9536f8478f","source_type":"APP","source_instance":"0"}';
      var filtered = appLogStreamController.jsonFilter(jsonMessage);

      // Message date should be blue
      var expected = '17:00:58.341: ';

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
      var filtered = appLogStreamController.jsonFilter(jsonMessage);

      // Message date should be blue
      var expected = '17:18:13.419: ';

      // Message source should be red
      expected += yellow + '[CELL.0]' + reset;

      // Message should be default colour
      expected += ' Successfully destroyed container\n';

      expect(filtered).toBe(expected);
    });

    it('should return passed string if non json', function () {
      var jsonMessage = 'Invalid JSON ... {message:"0"}';
      var filtered = appLogStreamController.jsonFilter(jsonMessage);
      expect(filtered).toBe(jsonMessage);
    });

    it('should set autoscroll to true', function () {
      expect(appLogStreamController.autoScrollOn).toBe(true);
      appLogStreamController.autoScrollOn = false;
      expect(appLogStreamController.autoScrollOn).toBe(false);
      appLogStreamController.autoScroll();
      expect(appLogStreamController.autoScrollOn).toBe(true);
    });

  });

})();
