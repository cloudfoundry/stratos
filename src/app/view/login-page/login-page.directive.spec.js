(function () {
  'use strict';

  // Fix me test
  describe('login-page directive', function () {
    var $element, $controller, $scope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(module(function ($provide) {
      $provide.value('$window', {
        pageYOffset: 0,
        scrollY: 0,
        document: {
          createElement: function () {
            return {};
          },
          getElementById: function () {
            return {};
          }
        },
        navigator: {
          userAgent: null
        },
        addEventListener: function (event, callback) {
          if (event === 'message') {
            return callback({
              data: '{"name":"GitHub Oauth - token"}'
            });
          }
        }
      });
      $provide.value('smoothScroll', function (element, scrollOptions) {
        scrollOptions.callbackAfter();
      });
    }));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();

      var markup = '<login-page><login-page/>';

      $element = angular.element(markup);
      $compile($element)($scope);

      $scope.$apply();

      $controller = $element.controller('loginPage');
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    describe('loginPageController', function () {
      beforeEach(function () {
        // mock data
        $controller.nextArrowVisible = true;
        $controller.sections = [
          { id: 'section_one', top: 0 },
          { id: 'section_two', top: 100 },
          { id: 'section_three', top: 200 }
        ];
        $controller.currentSectionIdx = 0;
        $controller.lastSectionIdx = 2;

        spyOn($controller, 'smoothScroll').and.callThrough();
      });

      it('should be defined', function () {
        expect($controller).toBeDefined();
      });

      describe('goToPrevSection', function () {
        it('should go to previous section', function () {
          $controller.goToNextSection();
          $scope.$apply();

          expect($controller.currentSectionIdx).toBe(1);
          expect($controller.smoothScroll).toHaveBeenCalled();

          $controller.$window.scrollY = 100;
          $controller.goToPrevSection();
          $scope.$apply();

          $controller.scrolling.then(function () {
            expect($controller.currentSectionIdx).toBe(0);
            expect($controller.smoothScroll).toHaveBeenCalled();
            done();
          });

        });

        it('should go to previous section if at first section but not top of page', function () {
          $controller.$window.scrollY = 10;
          $controller.goToPrevSection();
          $scope.$apply();

          expect($controller.currentSectionIdx).toBe(0);
          expect($controller.smoothScroll).toHaveBeenCalled();
        });

        it('should not go to previous section if not at top of page', function () {
          $controller.goToPrevSection();
          $scope.$apply();

          expect($controller.currentSectionIdx).toBe(0);
          expect($controller.smoothScroll).not.toHaveBeenCalled();
        });
      });

      describe('goToNextSection', function () {
        it('should go to next section', function () {
          $controller.goToNextSection();
          $scope.$apply();

          expect($controller.currentSectionIdx).toBe(1);
          expect($controller.smoothScroll).toHaveBeenCalled();
        });

        it('should not go to next section if last section reached', function () {
          var lastSection = $controller.lastSectionIdx;
          $controller.currentSectionIdx = lastSection;
          $controller.goToNextSection();
          $scope.$apply();

          expect($controller.currentSectionIdx).toBe(lastSection);
          expect($controller.smoothScroll).not.toHaveBeenCalled();
        });
      });

      describe('setCurrentSection', function () {
        it('should set current section to 0 if y === 0', function () {
          $controller.setCurrentSection(0);
          expect($controller.currentSectionIdx).toBe(0);
        });

        it('should set current section based on scroll position (y)', function () {
          $controller.setCurrentSection(110);
          expect($controller.currentSectionIdx).toBe(1);
        });
      });
    });
  });

})();
