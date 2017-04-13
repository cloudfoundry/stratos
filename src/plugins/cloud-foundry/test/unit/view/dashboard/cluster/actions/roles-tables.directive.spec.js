(function () {
  'use strict';

  describe('roles-tables directive', function () {
    var $httpBackend, $compile, element, controller, contextScope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $compile = $injector.get('$compile');
      contextScope = $injector.get('$rootScope').$new();
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    function createElement(config, organization) {
      contextScope.config = config || {};
      contextScope.organization = organization || {};
      contextScope.selection = undefined;
      contextScope.filter = undefined;

      var markup = '<roles-tables ' +
        'config="config" ' +
        'organization="organization">' +
        'selection="selection">' +
        'filter="filter">' +
        '</roles-tables>';

      element = angular.element(markup);
      $compile(element)(contextScope);

      contextScope.$apply();

      controller = element.controller('rolesTables');
    }

    it('should be defined', function () {
      createElement();
      expect(element).toBeDefined();
      expect(controller).toBeDefined();
      expect(controller.disableAssignSpaceRoles).toBeDefined();
      expect(controller.disableAssignOrgRoles).toBeDefined();
    });

    it('refresh', function () {
      createElement({
        showExistingRoles: true,
        users: [{
          metadata: {
            guid: 'userGuid'
          }
        }]
      }, {
        roles: {
          userGuid: {
          }
        }
      });
    });

  });

})();
