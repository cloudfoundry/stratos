(function () {
  'use strict';

  describe('credentials-dialog service', function () {
    var $httpBackend, dialogContext, connect, dialogPromise, appNotificationsService;

    var input = {
      cnsi: 'cnsi guid',
      formName: 'form name'
    };

    var mockResponse = {
      id: 1,
      name: 'cluster1',
      url: 'cluster1_url',
      username: 'cluster1_username',
      account: 'cluster1_password',
      token_expiry: 3600
    };

    beforeEach(module('templates'));
    beforeEach(module('console-app'));
    beforeEach(module({
      frameworkAsyncTaskDialog: function (content, context, actionTask) {
        dialogContext = context;
        connect = actionTask;
        return {
          result: true
        };
      }
    }));
    beforeEach(inject(function ($injector) {
      appNotificationsService = $injector.get('appNotificationsService');
      $httpBackend = $injector.get('$httpBackend');

      var appVarsManager = $injector.get('appCredentialsDialog');
      dialogPromise = appVarsManager.show(input.cnsi, input.formName);
      expect(dialogPromise).toBeDefined();

    }));

    it('correct context', function () {
      expect(dialogContext.cnsi).toEqual(input.cnsi);
      expect(dialogContext.formName).toEqual(input.formName);
      expect(dialogContext.data).toEqual({});
    });

    it('should call notify() on connect', function () {
      $httpBackend.when('POST', '/pp/v1/auth/login/cnsi').respond(200, mockResponse);
      spyOn(appNotificationsService, 'notify');
      dialogContext.data = 'something';

      connect().catch(function () {
        fail('connect func should not fail');
      });
      $httpBackend.flush();

      expect(appNotificationsService.notify).toHaveBeenCalled();
      expect(dialogContext.data).toEqual({});
      expect(dialogContext.errorMsg).toBeUndefined();
      expect(dialogContext.failedRegister).toBeUndefined();
    });

    it('handle failed to connect error', function () {
      $httpBackend.when('POST', '/pp/v1/auth/login/cnsi').respond(500, mockResponse);
      spyOn(appNotificationsService, 'notify');

      connect().then(function () {
        fail('connect func should not pass');
      });
      $httpBackend.flush();

      expect(appNotificationsService.notify).not.toHaveBeenCalled();
      expect(dialogContext.errorMsg).toEqual('endpoints.connect.error-server-failure');
      expect(dialogContext.failedRegister).toBeNull();
    });

    it('handle bad creds', function () {
      $httpBackend.when('POST', '/pp/v1/auth/login/cnsi').respond(400, mockResponse);
      spyOn(appNotificationsService, 'notify');

      connect().then(function () {
        fail('connect func should not pass');
      });
      $httpBackend.flush();

      expect(appNotificationsService.notify).not.toHaveBeenCalled();
      expect(dialogContext.errorMsg).toEqual('endpoints.connect.error-user-input');
      expect(dialogContext.failedRegister).toBe(true);
    });

    it('handle bad creds', function () {
      $httpBackend.when('POST', '/pp/v1/auth/login/cnsi').respond(-1, mockResponse);
      spyOn(appNotificationsService, 'notify');

      connect().then(function () {
        fail('connect func should not pass');
      });
      $httpBackend.flush();

      expect(appNotificationsService.notify).not.toHaveBeenCalled();
      expect(dialogContext.errorMsg).toEqual('endpoints.connect.error-no-connect');
      expect(dialogContext.failedRegister).toBeNull();
    });

  });

})();
