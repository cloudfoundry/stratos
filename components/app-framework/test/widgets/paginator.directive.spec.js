(function () {
  'use strict';

  describe('paginator directive', function () {
    var element, myPaginatorCtrl, currentPageNumber, callback, contextScope;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      var $q = $injector.get('$q');
      var $compile = $injector.get('$compile');

      contextScope = $injector.get('$rootScope').$new();

      callback = function (page) {
        currentPageNumber = page;
        return $q.resolve();
      };

      contextScope.paginationOptions = {
        callback: callback,
        total: 20,
        text: {
          nextBtn: 'Next',
          prevBtn: 'Previous'
        }
      };
      var markup = '<paginator properties="paginationOptions"></paginator>';
      element = angular.element(markup);
      $compile(element)(contextScope);
      contextScope.$apply();
      myPaginatorCtrl = element.controller('paginator');
    }));

    it('should be defined', function () {
      expect(element).toBeDefined();
      expect(myPaginatorCtrl).toBeDefined();
      expect(myPaginatorCtrl.properties).toBeDefined();
    });

    it('should have right callback', function () {
      expect(myPaginatorCtrl.properties.callback).toBe(callback);
    });

    it('should have right total number', function () {
      expect(myPaginatorCtrl.properties.total).toBe(20);
    });

    it('should have right button labels', function () {
      expect(myPaginatorCtrl.properties.text).toBeDefined();
      expect(myPaginatorCtrl.properties.text.nextBtn).toBe('Next');
      expect(myPaginatorCtrl.properties.text.prevBtn).toBe('Previous');
    });

    it('should be initialized correctly', function () {
      expect(myPaginatorCtrl.range).toEqual([2, 3, 4, 5]);
      expect(myPaginatorCtrl.isLoading).toBe(false);
    });

    it('should have right current page number', function () {
      expect(myPaginatorCtrl.currentPageNumber).toBe(1);
      expect(myPaginatorCtrl.properties.pageNumber).toBe(1);

      // Nothing should have called callback yet
      expect(currentPageNumber).toBeUndefined();

      myPaginatorCtrl.loadPage(2);
      expect(myPaginatorCtrl.currentPageNumber).toBe(2);
      expect(currentPageNumber).toBe(2);
      expect(currentPageNumber).toBe(myPaginatorCtrl.properties.pageNumber);

      myPaginatorCtrl.loadPage(-1);
      expect(myPaginatorCtrl.currentPageNumber).toBe(2);
      expect(currentPageNumber).toBe(2);
      expect(currentPageNumber).toBe(myPaginatorCtrl.properties.pageNumber);
    });

    it('should have right number of DOM elements', function () {
      expect(element.find('.page-links > span').length).toBe(7);

      myPaginatorCtrl.properties.total = 1;
      contextScope.$apply();
      expect(element.find('.page-links > span').length).toBe(0);

      myPaginatorCtrl.properties.total = 2;
      contextScope.$apply();
      expect(element.find('.page-links > span').length).toBe(2);

      myPaginatorCtrl.properties.total = 3;
      contextScope.$apply();
      expect(element.find('.page-links > span').length).toBe(3);

      myPaginatorCtrl.properties.total = 4;
      contextScope.$apply();
      expect(element.find('.page-links > span').length).toBe(4);

      myPaginatorCtrl.properties.total = 5;
      contextScope.$apply();
      expect(element.find('.page-links > span').length).toBe(5);

      myPaginatorCtrl.properties.total = 6;
      contextScope.$apply();
      expect(element.find('.page-links > span').length).toBe(6);

      myPaginatorCtrl.properties.total = 7;
      contextScope.$apply();
      expect(element.find('.page-links > span').length).toBe(7);

      myPaginatorCtrl.properties.total = 8;
      contextScope.$apply();
      expect(element.find('.page-links > span').length).toBe(7);

      myPaginatorCtrl.properties.total = 9;
      contextScope.$apply();
      expect(element.find('.page-links > span').length).toBe(7);
    });

    it('should have right current page number when total number changes', function () {
      expect(myPaginatorCtrl.properties.pageNumber).toBe(1);

      myPaginatorCtrl.properties.pageNumber = 20;

      expect(myPaginatorCtrl.properties.pageNumber).toBe(myPaginatorCtrl.properties.total);

      myPaginatorCtrl.properties.total = 19;
      contextScope.$apply();
      expect(myPaginatorCtrl.currentPageNumber).toBe(myPaginatorCtrl.properties.total);
      expect(myPaginatorCtrl.properties.pageNumber).toBe(myPaginatorCtrl.properties.total);

      myPaginatorCtrl.properties.total = 18;
      contextScope.$apply();
      expect(myPaginatorCtrl.currentPageNumber).toBe(myPaginatorCtrl.properties.total);
      expect(myPaginatorCtrl.properties.pageNumber).toBe(myPaginatorCtrl.properties.total);

      myPaginatorCtrl.properties.total = 2;
      contextScope.$apply();
      expect(myPaginatorCtrl.currentPageNumber).toBe(myPaginatorCtrl.properties.total);
      expect(myPaginatorCtrl.properties.pageNumber).toBe(myPaginatorCtrl.properties.total);

      myPaginatorCtrl.properties.total = 1;
      contextScope.$apply();
      expect(myPaginatorCtrl.currentPageNumber).toBe(myPaginatorCtrl.properties.total);
      expect(myPaginatorCtrl.properties.pageNumber).toBe(myPaginatorCtrl.properties.total);
    });

    it('should have right range', function () {
      myPaginatorCtrl.properties.pageNumber = 1;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([2, 3, 4, 5]);

      myPaginatorCtrl.properties.pageNumber = 2;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([2, 3, 4, 5]);

      myPaginatorCtrl.properties.pageNumber = 3;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([2, 3, 4, 5]);

      myPaginatorCtrl.properties.pageNumber = 4;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([2, 3, 4, 5]);

      myPaginatorCtrl.properties.pageNumber = 5;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([4, 5, 6]);

      myPaginatorCtrl.properties.pageNumber = 6;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([5, 6, 7]);

      myPaginatorCtrl.properties.pageNumber = 10;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([9, 10, 11]);

      myPaginatorCtrl.properties.pageNumber = 16;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([15, 16, 17]);

      myPaginatorCtrl.properties.pageNumber = 17;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([16, 17, 18, 19]);

      myPaginatorCtrl.properties.pageNumber = 18;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([16, 17, 18, 19]);

      myPaginatorCtrl.properties.pageNumber = 19;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([16, 17, 18, 19]);

      myPaginatorCtrl.properties.pageNumber = 20;
      myPaginatorCtrl.calculateRange();
      expect(myPaginatorCtrl.range).toEqual([16, 17, 18, 19]);
    });
  });

})();
