(function () {
  'use strict';

  describe('navigation model', function () {
    var navigationModel;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      var modelManager = $injector.get('app.model.modelManager');
      navigationModel = modelManager.retrieve('app.model.navigation');
    }));

    it('should be defined', function () {
      expect(navigationModel).toBeDefined();
    });

    // property definitions

    it('should have properties `eventService` defined', function () {
      expect(navigationModel.eventService).toBeDefined();
    });

    it('should have properties `$state` defined', function () {
      expect(navigationModel.$state).toBeDefined();
    });

    it('should have properties `menu` defined', function () {
      expect(navigationModel.menu).toBeDefined();
    });

    // method definitions

    it('should have method `onLogin` defined', function () {
      expect(angular.isFunction(navigationModel.onLogin)).toBe(true);
    });

    it('should have method `onLogout` defined', function () {
      expect(angular.isFunction(navigationModel.onLogout)).toBe(true);
    });

    it('should have method `onAutoNav` defined', function () {
      expect(angular.isFunction(navigationModel.onAutoNav)).toBe(true);
    });

    // method invocation

    it('`onLogin` should called when events.LOGGED_IN triggered', function () {
      spyOn(navigationModel, 'onLogin');
      navigationModel.eventService.$emit(navigationModel.eventService.events.LOGIN);
      expect(navigationModel.onLogin).toHaveBeenCalled();
    });

    it('`onLogout` should called when events.LOGGED_OUT triggered', function () {
      spyOn(navigationModel, 'onLogout');
      navigationModel.eventService.$emit(navigationModel.eventService.events.LOGOUT);
      expect(navigationModel.onLogout).toHaveBeenCalled();
    });

    it('`onAutoNav` should called when events.REDIRECT triggered', function () {
      spyOn(navigationModel, 'onAutoNav');
      navigationModel.eventService.$emit(navigationModel.eventService.events.REDIRECT, 'cf.applications');
      expect(navigationModel.onAutoNav).toHaveBeenCalledWith(jasmine.any(Object), 'cf.applications');
    });

    it('`$state.go` should called and menu should be set when events.REDIRECT triggered', function () {
      spyOn(navigationModel.$state, 'go');
      navigationModel.eventService.$emit(navigationModel.eventService.events.REDIRECT, 'cf.applications');
      expect(navigationModel.$state.go).toHaveBeenCalledWith('cf.applications');
      expect(navigationModel.menu.currentState).toBe('cf.applications');
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
