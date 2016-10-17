(function () {
  'use strict';

  describe('Edit-App Service', function () {
    var editAppFactory, $httpBackend;

    var cnsiGuid = 'guid';
    var appGuid = 'appGuid';

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module({
      'helion.framework.widgets.asyncTaskDialog': function (content, context, actionTask) {
        return {
          content: content,
          context: context,
          actionTask: actionTask
        };
      }
    }));

    beforeEach(inject(function ($injector) {
      editAppFactory = $injector.get('cloud-foundry.view.applications.application.summary.editApp');
      $httpBackend = $injector.get('$httpBackend');

    }));

    it('should be defined', function () {
      expect(editAppFactory).toBeDefined();
      expect(editAppFactory.display).toBeDefined();
    });

    it('should be send PUT request on update ', function () {

      $httpBackend.expectPUT('/pp/v1/proxy/v2/apps/appGuid').respond(201, {});
      var asynContext = editAppFactory.display(cnsiGuid, appGuid);
      asynContext.actionTask({});
      $httpBackend.flush();
    });

  });

})();
