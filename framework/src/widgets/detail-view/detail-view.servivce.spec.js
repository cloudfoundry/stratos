(function () {
  'use strict';

  describe('detail service', function () {
    var detailView, detailViewContent, detailViewContext, detailViewScope;

    MockDetailViewController.$inject = [
      'context',
      'content',
      '$scope'
    ];

    function MockDetailViewController(context, content, $scope) {
      detailViewContent = content;
      detailViewContext = context;
      detailViewScope = $scope;
    }

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));
    beforeEach(module('ui.bootstrap'));

    beforeEach(inject(function ($injector) {
      detailView = $injector.get('helion.framework.widgets.detailView');
      var $rootScope = $injector.get('$rootScope');
      var content = {
        title: 'Title',
        controller: MockDetailViewController
      };
      var context = {
        test: '123456e'
      };
      detailView(content, context);
      $rootScope.$digest();
    }));

    it('detailView is defined as function', function () {
      expect(angular.isFunction(detailView)).toBe(true);
    });

    it('detailView should have modal $close and $dismiss', function () {
      expect(detailViewScope.$dismiss).toBeDefined();
      expect(detailViewScope.$close).toBeDefined();
    });

    it('detailView was attached with passed context', function () {
      expect(detailViewContext).toBeDefined();
      expect(detailViewContext.test).toBe('123456e');
    });

    it('detailView was attached with correct content', function () {
      expect(detailViewContent).toBeDefined();
      expect(detailViewContent.title).toBe('Title');
    });

  });

})();
