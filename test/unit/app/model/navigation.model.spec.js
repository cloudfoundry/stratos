(function () {
  'use strict';

  describe('navigation model', function () {
    var navigationModel, appEventService, $state;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      var modelManager = $injector.get('modelManager');
      navigationModel = modelManager.retrieve('app.model.navigation');
      appEventService = $injector.get('appEventService');
      $state = $injector.get('$state');
    }));

    it('should be defined', function () {
      expect(navigationModel).toBeDefined();
    });

    // property definitions

    it('should have properties `menu` defined', function () {
      expect(navigationModel.menu).toBeDefined();
    });

    // method invocation

    it('`onLogin` should called when events.LOGGED_IN triggered', function () {
      spyOn(navigationModel.menu, 'reset');
      appEventService.$emit(appEventService.events.LOGIN);
      expect(navigationModel.menu.reset).toHaveBeenCalled();
    });

    it('`onLogout` should called when events.LOGGED_OUT triggered', function () {
      spyOn(navigationModel.menu, 'reset');
      appEventService.$emit(appEventService.events.LOGOUT);
      expect(navigationModel.menu.reset).toHaveBeenCalled();
    });

    it('`onAutoNav` should called when events.REDIRECT triggered', function () {
      spyOn($state, 'go');
      appEventService.$emit(appEventService.events.REDIRECT, 'cf.applications');
      expect($state.go).toHaveBeenCalledWith('cf.applications', undefined);
    });

    it('`$state.go` should be called when events.REDIRECT triggered', function () {
      spyOn($state, 'go');
      appEventService.$emit(appEventService.events.REDIRECT, 'cf.applications');
      expect($state.go).toHaveBeenCalledWith('cf.applications', undefined);
      // TEAMFOUR-366 - the menu is now updated using a $rootScope stateChangeSuccess handler
      // expect(navigationModel.menu.currentState).toBe('cf.applications');
    });

    // Menu

    it('should have properties `menu` as an arry', function () {
      expect(angular.isArray(navigationModel.menu.constructor.prototype)).toBe(true);
    });

    it('`menu` property should have properties `currentState` defined', function () {
      expect(navigationModel.menu.currentState).toBeDefined();
    });

    it('`menu` property should have method `addMenuItem` defined', function () {
      expect(angular.isFunction(navigationModel.menu.addMenuItem)).toBe(true);
    });

  });

})();
