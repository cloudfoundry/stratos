(function () {
  'use strict';

  describe('select-input directive', function () {
    var $compile, $document;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $document = $injector.get('$document');
    }));

    describe('with default settings', function () {
      var contextScope, element, selectInputCtrl;

      beforeEach(inject(function ($injector) {
        contextScope = $injector.get('$rootScope').$new();
        contextScope.mockOptions = [
          {label: 'Option 1', value: 1},
          {label: 'Option 2', value: 2}
        ];
        contextScope.mockValue = null;

        var markup = '<select-input input-label="Label" ' +
          'input-options="mockOptions" ' +
          'ng-model="mockValue">' +
          '</select-input>';

        element = angular.element(markup);
        $compile(element)(contextScope);

        contextScope.$apply();

        selectInputCtrl = element.controller('selectInput');
        spyOn(selectInputCtrl, 'searchAndSetValue').and.callThrough();
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should be initially hidden', function () {
        expect(selectInputCtrl.open).toBe(false);
      });

      it('should have input value label initially null', function () {
        expect(selectInputCtrl.modelLabel).toBe(null);
      });

      it('should use default placeholder text when value is not defined', function () {
        expect(selectInputCtrl.placeholder).toBe('Select');
        expect(element.find('span').text().trim()).toBe('Select');
      });

      it('should use default arrow icon', function () {
        expect(selectInputCtrl.arrowIcon).toBe('helion-icon helion-icon-Up_tab helion-icon-r180');
        expect(element.find('i').hasClass('helion-icon helion-icon-Up_tab helion-icon-r180')).toBe(true);
      });

      it('should toggle menu on click', function () {
        element.triggerHandler('click');
        expect(selectInputCtrl.open).toBe(true);
      });

      it('should dismiss menu when clicking outside input field', function () {
        element.triggerHandler('click');
        expect(selectInputCtrl.open).toBe(true);

        var target = angular.element('<div></div>')[0];
        $document.triggerHandler({type: 'click', target: target});
        expect(selectInputCtrl.open).toBe(false);
      });

      it('should not dismiss menu when not clicking outside input field', function () {
        element.triggerHandler('click');
        expect(selectInputCtrl.open).toBe(true);

        $document.triggerHandler({type: 'click', target: element[0]});
        expect(selectInputCtrl.open).toBe(true);
      });

      it('should list 2 options with one header', function () {
        expect(element.find('li').length).toBe(3);
      });

      it('should set value on option select', function () {
        element.triggerHandler('click');
        angular.element(element.find('li')[1]).triggerHandler('click');
        expect(contextScope.mockValue).toBe(1);
      });

      it('should set value when setValue() called', function () {
        selectInputCtrl.setValue({label: 'Option 1', value: 1});
        expect(selectInputCtrl.modelLabel).toBe('Option 1');
        expect(contextScope.mockValue).toBe(1);
      });

      it('should toggle `open` when toggleMenu() called', function () {
        expect(selectInputCtrl.open).toBe(false);

        selectInputCtrl.toggleMenu();
        expect(selectInputCtrl.open).toBe(true);

        selectInputCtrl.toggleMenu();
        expect(selectInputCtrl.open).toBe(false);
      });

      describe('searchAndSetValue function', function () {
        it('should not search if search term provided is null', function () {
          selectInputCtrl.searchAndSetValue(null);
          expect(contextScope.mockValue).toBe(null);
          expect(selectInputCtrl.modelLabel).toBe(null);
        });

        it('should not search if search term provided is undefined', function () {
          selectInputCtrl.searchAndSetValue(undefined);
          expect(contextScope.mockValue).toBe(null);
          expect(selectInputCtrl.modelLabel).toBe(null);
        });

        it('should not search if search term provided is an empty string', function () {
          selectInputCtrl.searchAndSetValue('');
          expect(contextScope.mockValue).toBe(null);
          expect(selectInputCtrl.modelLabel).toBe(null);
        });

        it('should set value to first matching option', function () {
          selectInputCtrl.searchAndSetValue('o');
          expect(contextScope.mockValue).toBe(1);
          expect(selectInputCtrl.modelLabel).toBe('Option 1');
        });

        it('should set value to second matching option if first already set', function () {
          selectInputCtrl.searchAndSetValue('o');
          expect(contextScope.mockValue).toBe(1);
          expect(selectInputCtrl.modelLabel).toBe('Option 1');

          selectInputCtrl.searchAndSetValue('o');
          expect(contextScope.mockValue).toBe(2);
          expect(selectInputCtrl.modelLabel).toBe('Option 2');
        });

        it('should not set value if no matching options found', function () {
          selectInputCtrl.searchAndSetValue('foo');
          expect(contextScope.mockValue).toBe(null);
          expect(selectInputCtrl.modelLabel).toBe(null);
        });

        it('should not change value if no matching options found', function () {
          selectInputCtrl.searchAndSetValue('o');
          expect(contextScope.mockValue).toBe(1);
          expect(selectInputCtrl.modelLabel).toBe('Option 1');

          selectInputCtrl.searchAndSetValue('foo');
          expect(contextScope.mockValue).toBe(1);
          expect(selectInputCtrl.modelLabel).toBe('Option 1');
        });
      });

      describe('on keypress', function () {
        it('should set open === false on escape', function () {
          selectInputCtrl.open = true;
          element.triggerHandler({type: 'keypress', keyCode: 27});
          expect(selectInputCtrl.open).toBe(false);
        });

        it('should set open === true on enter', function () {
          element.triggerHandler({type: 'keypress', which: 13});
          expect(selectInputCtrl.open).toBe(true);
        });

        it('should set open === true on space', function () {
          element.triggerHandler({type: 'keypress', which: 32});
          expect(selectInputCtrl.open).toBe(true);
        });

        it('should set open === false if other key pressed', function () {
          selectInputCtrl.open = true;

          element.triggerHandler({type: 'keypress', which: 65});
          expect(selectInputCtrl.open).toBe(false);
          expect(selectInputCtrl.searchAndSetValue).toHaveBeenCalledWith('A');
        });
      });
    });

    describe('with custom options', function () {
      var contextScope, element, selectInputCtrl;

      beforeEach(inject(function ($injector) {
        contextScope = $injector.get('$rootScope').$new();
        contextScope.mockOptions = [
          {label: 'Option 1', value: 1},
          {label: 'Option 2', value: 2}
        ];
        contextScope.mockValue = null;

        var markup = '<select-input input-label="Label" ' +
          'input-options="mockOptions" ' +
          'ng-model="mockValue" ' +
          'placeholder="placeholder" arrow-icon="arrow-icon">' +
          '</select-input>';

        element = angular.element(markup);
        $compile(element)(contextScope);

        contextScope.$apply();

        selectInputCtrl = element.controller('selectInput');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should use specified icon for arrow', function () {
        expect(selectInputCtrl.arrowIcon).toBe('arrow-icon');
        expect(element.find('i').hasClass('arrow-icon')).toBe(true);
      });

      it('should use specified placeholder', function () {
        expect(selectInputCtrl.placeholder).toBe('placeholder');
        expect(element.find('span').text().trim()).toBe('placeholder');
      });
    });
  });

})();
