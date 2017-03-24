(function () {
  'use strict';

  describe('checkbox-input directive', function () {
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
      var contextScope, element, checkboxInputCtrl;

      beforeEach(inject(function ($injector) {
        contextScope = $injector.get('$rootScope').$new();
        contextScope.mockOption = mockOptions[0];
        contextScope.mockValue = null;

        var markup = '<checkbox-input ng-model="mockValue" ' +
          'input-value="mockOption.value">' +
          '</checkbox-input>';

        element = angular.element(markup);
        $compile(element)(contextScope);

        contextScope.$apply();

        checkboxInputCtrl = element.controller('checkboxInput');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have input disabled initially undefined', function () {
        expect(checkboxInputCtrl.inputDisabled).toBeUndefined();
      });

      it('should have input label initially undefined', function () {
        expect(checkboxInputCtrl.inputLabel).toBeUndefined();
      });

      it('should set model value to true on click', function () {
        element.triggerHandler('click');
        expect(contextScope.mockValue).toBe(true);
      });

      it('should set this input as checked on click', function () {
        element.triggerHandler('click');
        expect(checkboxInputCtrl.checked).toBe(true);
      });

      it('should set checked === true on space keypress', function () {
        element.triggerHandler({type: 'keypress', which: 32});
        expect(checkboxInputCtrl.checked).toBe(true);
        expect(contextScope.mockValue).toBe(true);
      });

      it('should set checked === false if other key pressed', function () {
        element.triggerHandler({type: 'keypress', which: 65});
        expect(checkboxInputCtrl.checked).toBe(null);
        expect(contextScope.mockValue).toBe(null);
      });

      it('should set checked === false if checkbox clicked twice', function () {
        element.triggerHandler('click');
        element.triggerHandler('click');
        expect(checkboxInputCtrl.checked).toBe(false);
        expect(contextScope.mockValue).toBe(false);
      });
    });

    describe('with custom options', function () {
      var contextScope, element, checkboxInputCtrl;

      beforeEach(inject(function ($injector) {
        contextScope = $injector.get('$rootScope').$new();
        contextScope.mockOption = mockOptions[1];
        contextScope.mockLabel = 'checkbox-input-label';
        contextScope.mockValue = null;

        var markup = '<checkbox-input ng-model="mockValue" ' +
          'input-value="mockOption.value" ' +
          'input-label="{{mockLabel}}" ' +
          'input-disabled="mockOption.disabled">' +
          '</checkbox-input>';

        element = angular.element(markup);
        $compile(element)(contextScope);

        contextScope.$apply();

        checkboxInputCtrl = element.controller('checkboxInput');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should use specified label', function () {
        expect(checkboxInputCtrl.inputLabel).toBe('checkbox-input-label');
      });

      it('should not set model value to this disabled input value on click', function () {
        element.triggerHandler('click');
        expect(contextScope.mockValue).toBe(null);
      });

      it('should not set this disabled input as checked on click', function () {
        element.triggerHandler('click');
        expect(checkboxInputCtrl.checked).toBe(null);
      });

      it('should not set checked === true on enter keypress for this disabled input', function () {
        element.triggerHandler({type: 'keypress', which: 13});
        expect(checkboxInputCtrl.checked).toBe(null);
        expect(contextScope.mockValue).toBe(null);
      });
    });
  });

})();
