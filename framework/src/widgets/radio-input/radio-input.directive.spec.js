(function () {
  'use strict';

  describe('radio-input directive', function () {
    var $compile, mockOptions;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');

      mockOptions = [
        {label: 'Option 1', value: 1},
        {label: 'Option 2', value: 2, disabled: true}
      ];
    }));

    describe('with default settings', function () {
      var contextScope, element, radioInputCtrl;

      beforeEach(inject(function ($injector) {
        contextScope = $injector.get('$rootScope').$new();
        contextScope.mockOption = mockOptions[0];
        contextScope.mockValue = null;

        var markup = '<radio-input ng-model="mockValue" ' +
          'input-value="mockOption.value">' +
          '</radio-input>';

        element = angular.element(markup);
        $compile(element)(contextScope);

        contextScope.$apply();

        radioInputCtrl = element.controller('radioInput');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have input disabled initially undefined', function () {
        expect(radioInputCtrl.inputDisabled).toBeUndefined();
      });

      it('should have input label initially undefined', function () {
        expect(radioInputCtrl.inputLabel).toBeUndefined();
      });

      it('should set model value to this input value on click', function () {
        element.triggerHandler('click');
        expect(contextScope.mockValue).toBe(1);
      });

      it('should set this input as checked on click', function () {
        element.triggerHandler('click');
        expect(radioInputCtrl.checked).toBe(true);
      });

      it('should set checked === true on enter keypress', function () {
        element.triggerHandler({type: 'keypress', which: 13});
        expect(radioInputCtrl.checked).toBe(true);
        expect(contextScope.mockValue).toBe(1);
      });

      it('should set checked === true on space keypress', function () {
        element.triggerHandler({type: 'keypress', which: 32});
        expect(radioInputCtrl.checked).toBe(true);
        expect(contextScope.mockValue).toBe(1);
      });

      it('should set checked === true on enter keypress', function () {
        element.triggerHandler({type: 'keypress', keyCode: 13});
        expect(radioInputCtrl.checked).toBe(true);
        expect(contextScope.mockValue).toBe(1);
      });

      it('should set checked === false if other key pressed', function () {
        element.triggerHandler({type: 'keypress', which: 65});
        expect(radioInputCtrl.checked).toBe(false);
        expect(contextScope.mockValue).toBe(null);
      });
    });

    describe('with custom options', function () {
      var contextScope, element, radioInputCtrl;

      beforeEach(inject(function ($injector) {
        contextScope = $injector.get('$rootScope').$new();
        contextScope.mockOption = mockOptions[1];
        contextScope.mockLabel = 'radio-input-label';
        contextScope.mockValue = null;

        var markup = '<radio-input ng-model="mockValue" ' +
          'input-value="mockOption.value" ' +
          'input-label="{{mockLabel}}" ' +
          'input-disabled="mockOption.disabled">' +
          '</radio-input>';

        element = angular.element(markup);
        $compile(element)(contextScope);

        contextScope.$apply();

        radioInputCtrl = element.controller('radioInput');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should use specified label', function () {
        expect(radioInputCtrl.inputLabel).toBe('radio-input-label');
      });

      it('should not set model value to this disabled input value on click', function () {
        element.triggerHandler('click');
        expect(contextScope.mockValue).toBe(null);
      });

      it('should not set this disabled input as checked on click', function () {
        element.triggerHandler('click');
        expect(radioInputCtrl.checked).toBe(false);
      });

      it('should not set checked === true on enter keypress for this disabled input', function () {
        element.triggerHandler({type: 'keypress', which: 13});
        expect(radioInputCtrl.checked).toBe(false);
        expect(contextScope.mockValue).toBe(null);
      });
    });
  });

})();
