(function () {
  'use strict';

  describe('selected-users-list directive', function () {
    var $httpBackend, element, controller;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var $compile = $injector.get('$compile');

      var contextScope = $injector.get('$rootScope').$new();
      contextScope.selectedUsers = undefined;
      contextScope.maxVisibleUsers = undefined;

      var markup = '<selected-users-list ' +
        'selected-users="selectedUsers" ' +
        'max-visible-users="maxVisibleUsers">' +
        '</selected-users-list>';

      element = angular.element(markup);
      $compile(element)(contextScope);

      contextScope.$apply();
      controller = element.controller('selectedUsersList');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(element).toBeDefined();
      expect(controller).toBeDefined();
    });

  });

})();
