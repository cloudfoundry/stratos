(function () {
  'use strict';

  describe('detail service', function () {
    var frameworkDetailView, detailViewContent, detailViewContext, detailViewScope;

    function MockDetailViewController(context, content, $scope) {
      detailViewContent = content;
      detailViewContext = context;
      detailViewScope = $scope;
    }

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));
    beforeEach(module('ui.bootstrap'));

    beforeEach(inject(function ($injector) {
      frameworkDetailView = $injector.get('frameworkDetailView');
      var $rootScope = $injector.get('$rootScope');
      var content = {
        title: 'Title',
        controller: MockDetailViewController
      };
      var context = {
        test: '123456e'
      };
      frameworkDetailView(content, context);
      $rootScope.$digest();
    }));

    it('frameworkDetailView is defined as function', function () {
      expect(angular.isFunction(frameworkDetailView)).toBe(true);
    });

    it('frameworkDetailView should have modal $close and $dismiss', function () {
      expect(detailViewScope.$dismiss).toBeDefined();
      expect(detailViewScope.$close).toBeDefined();
    });

    it('frameworkDetailView was attached with passed context', function () {
      expect(detailViewContext).toBeDefined();
      expect(detailViewContext.test).toBe('123456e');
    });

    it('frameworkDetailView was attached with correct content', function () {
      expect(detailViewContent).toBeDefined();
      expect(detailViewContent.title).toBe('Title');
    });

  });

})();
