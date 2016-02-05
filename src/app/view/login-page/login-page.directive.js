(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('loginPage', loginPage);

  loginPage.$inject = [
    'app.basePath',
    '$window'
  ];

  /**
   * @namespace app.view.loginPage
   * @memberof app.view
   * @name loginPage
   * @description A login page directive
   * @param {string} path - the application base path
   * @returns {object} The login page directive definition object
   */
  function loginPage(path, $window) {
    return {
      controller: LoginPageController,
      controllerAs: 'loginPageCtrl',
      link: loginPageLink,
      templateUrl: path + 'view/login-page/login-page.html'
    };

    function loginPageLink(scope, element, attrs, ctrl) {
      cacheSectionPositions();

      var windowElt = angular.element($window);

      windowElt
        .on('scroll', _.debounce(function () {
          handleScroll();
          scope.$apply();
        }, 150))
        .on('resize', _.debounce(function () {
          cacheSectionPositions();
          scope.$apply();
        }, 400));

      scope.$on('destroy', function () {
        window
          .off('scroll')
          .off('resize');
      });

      function cacheSectionPositions() {
        var scrollY = $window.scrollY;

        var sections = [{ id: 'section_login_panel', top: 0 }];
        angular.forEach(element.find('section'), function (elt) {
          sections.push({ id: elt.id, top: elt.getBoundingClientRect().top + scrollY });
        });

        ctrl.sections = sections;
        ctrl.lastSectionIdx = sections.length - 1;

        handleScroll();
      }

      function handleScroll() {
        var y = $window.scrollY;
        var scrollBottom = ctrl.sections[ctrl.lastSectionIdx].top || 0;

        ctrl.prevArrowVisible = y > 0;
        ctrl.nextArrowVisible = y < scrollBottom;
        ctrl.setCurrentSection(y);
      }
    }
  }

  LoginPageController.$inject = ['$window', 'smoothScroll'];

  function LoginPageController($window, smoothScroll) {
    this.$window = $window;
    this.smoothScroll = smoothScroll;

    this.prevArrowVisible = false;
    this.nextArrowVisible = false;

    this.sections = [];
    this.currentSectionIdx = 0;
    this.lastSectionIdx = 0;
  }

  angular.extend(LoginPageController.prototype, {
    goToNextSection: function () {
      if (this.currentSectionIdx < this.lastSectionIdx) {
        this.currentSectionIdx += 1;
        this.smoothScroll(document.getElementById(this.sections[this.currentSectionIdx].id));
      }
    },
    goToPrevSection: function () {
      var y = this.$window.scrollY;
      var sectionTop = this.sections[this.currentSectionIdx].top;
      var diff = y === sectionTop ? -1 : 0;
      this.currentSectionIdx += diff;
      this.smoothScroll(document.getElementById(this.sections[this.currentSectionIdx].id));
    },
    setCurrentSection: function (y) {
      var ctrl = this;

      angular.forEach(this.sections, function (section, idx) {
        if (y >= section.top) {
          ctrl.currentSectionIdx = idx;
        }
      });
    }
  });

})();
