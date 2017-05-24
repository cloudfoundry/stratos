(function () {
  'use strict';

  describe('seach-box directive', function () {
    var searchBoxCtrl, contextScope, element;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      contextScope = $injector.get('$rootScope').$new();
      contextScope.model = '';
      contextScope.options = [
        { label: 'option_1', value: 'OPTION_1' },
        { label: 'search_option_2', value: 'OPTION_2' },
        { label: 'search_option_3', value: 'OPTION_3' },
        { label: 'option_4', value: 'OPTION_4' }
      ];

      var markup = '<search-box ng-model="model" input-options="options"></search-box>';
      element = angular.element(markup);
      $compile(element)(contextScope);
      contextScope.$apply();
      searchBoxCtrl = element.controller('searchBox');
    }));

    it('should be defined', function () {
      expect(element).toBeDefined();
      expect(searchBoxCtrl).toBeDefined();
      expect(searchBoxCtrl.open).toBe(false);
      expect(searchBoxCtrl.isDirty).toBe(false);
      expect(searchBoxCtrl.searchText).toBe('option_1');
      expect(searchBoxCtrl.preSelected).toBe(0);
      expect(searchBoxCtrl.suggestions.length).toBe(4);
      expect(searchBoxCtrl.lastPick).toBeDefined();
      searchBoxCtrl.makePreselectedVisible();
    });

    it('should allow a suggestion to be picked', function () {
      searchBoxCtrl.pick(searchBoxCtrl.suggestions[3]);
    });

    it('should disallow a disabled suggestion to be picked', function () {
      searchBoxCtrl.pick(searchBoxCtrl.suggestions[3]);
      expect(searchBoxCtrl.lastPick.label).toBe('option_4');
      searchBoxCtrl.suggestions[2].disabled = true;
      searchBoxCtrl.pick(searchBoxCtrl.suggestions[2]);
      expect(searchBoxCtrl.lastPick.label).toBe('option_4');
    });

    it('should keep selection when reset', function () {
      searchBoxCtrl.pick(searchBoxCtrl.suggestions[3]);
      expect(searchBoxCtrl.preSelected).toBe(3);
      searchBoxCtrl.reset();
      expect(searchBoxCtrl.preSelected).toBe(3);
    });

    function makeEvent(code) {
      return {
        keyCode: code,
        preventDefault: function () {}
      };
    }

    it('should keep make suggestions', function () {
      searchBoxCtrl.searchText = 'search_';
      searchBoxCtrl.onChange();
      expect(searchBoxCtrl.open).toBe(true);
      expect(searchBoxCtrl.suggestions.length).toBe(2);
      searchBoxCtrl.closeIt();

      searchBoxCtrl.preSelectNextSuggestion();
      searchBoxCtrl.pickPreselectedSuggestion();
    });

    it('should handle key down events', function () {
      searchBoxCtrl.searchText = '';
      searchBoxCtrl.onChange();
      expect(searchBoxCtrl.open).toBe(true);

      searchBoxCtrl.onKeyDown(makeEvent(40));
      searchBoxCtrl.onKeyDown(makeEvent(38));
      searchBoxCtrl.onKeyDown(makeEvent(34));
      searchBoxCtrl.onKeyDown(makeEvent(33));
      searchBoxCtrl.onKeyDown(makeEvent(27));

      expect(searchBoxCtrl.open).toBe(false);
      searchBoxCtrl.onChange();
      searchBoxCtrl.onKeyDown(makeEvent(13));
      searchBoxCtrl.closeIt();
    });

    it('should open and close', function () {

      searchBoxCtrl.openIt();
      searchBoxCtrl.onChange();
      searchBoxCtrl.closeIt();

      searchBoxCtrl.openIt();
      searchBoxCtrl.openIt();
      expect(searchBoxCtrl.closeIt()).toBe(true);

      expect(searchBoxCtrl.open).toBe(false);
      searchBoxCtrl.onKeyDown(makeEvent(13));
      expect(searchBoxCtrl.open).toBe(true);
      expect(searchBoxCtrl.closeIt()).toBe(true);

      expect(searchBoxCtrl.open).toBe(false);
      searchBoxCtrl.onKeyDown(makeEvent(40));
      expect(searchBoxCtrl.open).toBe(true);
      expect(searchBoxCtrl.closeIt()).toBe(true);

      expect(searchBoxCtrl.open).toBe(false);
      searchBoxCtrl.onKeyDown(makeEvent(34));
      expect(searchBoxCtrl.open).toBe(true);
      expect(searchBoxCtrl.closeIt()).toBe(true);

      searchBoxCtrl.onKeyDown(makeEvent(27));
    });

    it('check mouse move', function () {
      searchBoxCtrl.onMouseMove(0);
      expect(searchBoxCtrl.preSelected).toBe(0);

      searchBoxCtrl.onMouseMove(2);
      expect(searchBoxCtrl.preSelected).toBe(2);

      searchBoxCtrl.skipNextMouseMove = true;
      searchBoxCtrl.onMouseMove(0);
      expect(searchBoxCtrl.preSelected).toBe(2);
      searchBoxCtrl.onMouseMove(1);
      expect(searchBoxCtrl.preSelected).toBe(1);
    });

    it('pick preselected', function () {
      searchBoxCtrl.onMouseMove(0);
      expect(searchBoxCtrl.preSelected).toBe(0);

      searchBoxCtrl.pickPreselectedSuggestion();
      searchBoxCtrl.onMouseMove(-1);
      expect(searchBoxCtrl.preSelected).toBe(-1);
      searchBoxCtrl.pickPreselectedSuggestion();
    });

    it('should clean up on $destroy', function () {
      contextScope.$destroy();
    });
  });
})();

