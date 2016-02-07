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
   * @param {object} $window - the Angular $window service
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
        windowElt
          .off('scroll')
          .off('resize');
      });

      function cacheSectionPositions() {
        var scrollY = $window.scrollY || $window.pageYOffset;

        var sections = [];
        angular.forEach(element.find('section'), function (elt) {
          var top = Math.round(elt.getBoundingClientRect().top + scrollY);
          sections.push({ id: elt.id, top: top });
        });

        if (sections.length > 0 && sections[0].top > 0) {
          sections.unshift({ id: 'section_login_panel', top: 0 });
        }

        ctrl.sections = sections;
        ctrl.lastSectionIdx = sections.length - 1;

        handleScroll();
      }

      function handleScroll() {
        var y = $window.scrollY || $window.pageYOffset;
        var scrollBottom = ctrl.sections[ctrl.lastSectionIdx].top || 0;

        ctrl.prevArrowVisible = y > 0;
        ctrl.nextArrowVisible = y < scrollBottom;
        ctrl.setCurrentSection(y);
      }
    }
  }

  LoginPageController.$inject = ['$window', 'smoothScroll'];

  /**
   * @namespace app.view.LoginPageController
   * @memberof app.view
   * @name LoginPageController
   * @constructor
   * @param {object} $window - the Angular $window service
   * @param {object} smoothScroll - the ngSmoothScroll service
   * @property {object} $window - the Angular $window service
   * @property {object} smoothScroll - the ngSmoothScroll service
   * @property {boolean} prevArrowVisible - show/hide previous arrow
   * @property {boolean} nextArrowVisible - show/hide next arrow
   * @property {array} sections - the sections containing content
   * @property {number} currentSectionIdx - the index of the current section
   * @property {number} lastSectionIdx - the index of the last section
   */
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
    /**
     * @function goToNextSection
     * @memberof app.view.LoginPageController
     * @description Scroll to the next section
     * @public
     */
    goToNextSection: function () {
      if (this.currentSectionIdx < this.lastSectionIdx) {
        this.currentSectionIdx += 1;
        var id = this.sections[this.currentSectionIdx].id;
        this.smoothScroll(this.$window.document.getElementById(id));
      }
    },
    /**
     * @function goToPrevSection
     * @memberof app.view.LoginPageController
     * @description Scroll back to previous section
     * @public
     */
    goToPrevSection: function () {
      if (this.currentSectionIdx > 0) {
        var y = this.$window.scrollY || this.$window.pageYOffset;
        var sectionTop = this.sections[this.currentSectionIdx].top;
        var diff = y === sectionTop ? -1 : 0;
        this.currentSectionIdx += diff;
        var id = this.sections[this.currentSectionIdx].id;
        this.smoothScroll(this.$window.document.getElementById(id));
      }
    },
    /**
     * @function setCurrentSection
     * @memberof app.view.LoginPageController
     * @description Set the current visible section
     * @param {number} y - the current scroll position
     * @public
     */
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
