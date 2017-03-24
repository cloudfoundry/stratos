(function () {
  'use strict';

  describe('mouse wheel handler directive', function () {
    var $compile, contextScope, element;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');

      contextScope = $injector.get('$rootScope').$new();
      contextScope.wheelHandlerFn = function () {};
      spyOn(contextScope, 'wheelHandlerFn').and.callThrough();

      var markup = '<div wheel-handler="wheelHandlerFn(delta)"></div>';
      element = angular.element(markup);
      $compile(element)(contextScope);
      contextScope.$apply();

    }));

    it('should be defined', function () {
      expect(element).toBeDefined();
    });

    it('should handle mousewheel events', function () {
      var mockEvent = $.Event('mousewheel', {
        originalEvent : {
          wheelDelta: 12
        }
      });
      mockEvent.originalEvent.preventDefault = jasmine.createSpy('preventDefault');
      expect(element).toBeDefined();
      element.triggerHandler(mockEvent);
      expect(mockEvent.originalEvent.preventDefault).toHaveBeenCalled();

      contextScope.$apply();
      expect(contextScope.wheelHandlerFn).toHaveBeenCalledWith(1);

      mockEvent = $.Event('mousewheel', {
        originalEvent : {
          wheelDelta: -1
        }
      });
      element.triggerHandler(mockEvent);
      expect(contextScope.wheelHandlerFn).toHaveBeenCalledWith(-1);

      mockEvent = $.Event('mousewheel', {
        originalEvent : {
          detail: 1
        }
      });
      element.triggerHandler(mockEvent);
      expect(contextScope.wheelHandlerFn).toHaveBeenCalledWith(-1);
    });
  });
})();
