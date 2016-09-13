(function () {
  'use strict';

  describe('Add-route controller test', function () {
    var $httpBackend, addRoutesFactory;

    var spaceGuid = 'testSpace';
    var domainGuid = 'testDomain';
    var cnsiGuid = 'testCnsi';
    var applicationId = 'testApplicationId';
    var path = 'testpath';
    var mockAddRouteResponse = {
      testCnsi: {
        metadata: {
          guid: 'testGuid'
        }
      }
    };
    var data = {
      path: null,
      port: null,
      host: path,
      space_guid: spaceGuid,
      domain_guid: domainGuid
    };

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
      addRoutesFactory = $injector.get('cloud-foundry.view.applications.application.summary.addRoutes');
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');

      // Initialise model data
      var model = modelManager.retrieve('cloud-foundry.model.application');
      var availableDomains = [{name: 'test.com', guid: domainGuid}];
      _.set(model, 'application.summary.available_domains', availableDomains);
      _.set(model, 'application.summary.space_guid', spaceGuid);
    }));

    it('should be defined', function () {
      expect(addRoutesFactory).toBeDefined();
    });

    it('should pass correct content spec to asyncTaskDialog', function () {
      var modalObj = addRoutesFactory.add(cnsiGuid, applicationId);
      expect(modalObj.content.title).toBeDefined();
      expect(modalObj.content.templateUrl).toBeDefined();
      expect(modalObj.content.buttonTitles.submit).toBeDefined();
    });

    it('should have `domain_guid`, `space_guid` set to appropriate values', function () {
      var modalObj = addRoutesFactory.add(cnsiGuid, applicationId);
      expect(modalObj.context.data.space_guid).toEqual(spaceGuid);
      expect(modalObj.context.data.domain_guid).toEqual(domainGuid);
    });

    it('should successfully add a route', function () {

      var expectedPostReq = {
        domain_guid: domainGuid,
        host: path,
        space_guid: spaceGuid
      };

      var modalObj = addRoutesFactory.add(cnsiGuid, applicationId);

      $httpBackend.expectGET('/pp/v1/proxy/v2/shared_domains').respond(200, {});
      $httpBackend.expectPOST('/pp/v1/proxy/v2/routes', expectedPostReq).respond(200, mockAddRouteResponse);
      $httpBackend.expectPUT('/pp/v1/proxy/v2/routes/testGuid/apps/testApplicationId').respond(200, {});
      $httpBackend.expectGET('/pp/v1/proxy/v2/apps/' + applicationId + '/summary').respond(200, {});

      var dialog = {
        context: {
          options: {
            domainMap: {}
          }
        }
      };

      modalObj.actionTask(data, dialog);
      $httpBackend.flush();
    });

  });
})();
