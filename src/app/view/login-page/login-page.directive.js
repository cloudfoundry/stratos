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
        .on('scroll', _.debounce(function onScroll() {
          handleScroll();
          scope.$apply();
        }, 150))
        .on('resize', _.debounce(function onResize() {
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

        /**
         * Section Object:
         * id - {string}, the ID of the <section>
         * top - {number}, the top Y-position of the <section> in context of the page
         */
        var sections = [];
        angular.forEach(element.find('section'), function (elt) {
          var top = Math.floor(elt.getBoundingClientRect().top + scrollY);
          sections.push({ id: elt.id, top: top });
        });

        if (sections.length > 0 && sections[0].top > 0) {
          sections.unshift({ id: 'section-login-panel', top: 0 });
        }

        ctrl.sections = sections;
        ctrl.lastSectionIdx = sections.length - 1;

        handleScroll();
      }

      function handleScroll() {
        var y = Math.floor($window.scrollY || $window.pageYOffset);
        var scrollBottom = ctrl.sections[ctrl.lastSectionIdx].top || 0;

        ctrl.prevArrowVisible = y > 0;
        ctrl.nextArrowVisible = y < scrollBottom;
        ctrl.setCurrentSection(y);
      }
    }
  }

  LoginPageController.$inject = ['$window', '$q', 'smoothScroll'];

  /**
   * @namespace app.view.LoginPageController
   * @memberof app.view
   * @name LoginPageController
   * @constructor
   * @param {object} $window - the Angular $window service
   * @param {object} $q - the Angular Promise service
   * @param {object} smoothScroll - the ngSmoothScroll service
   * @property {object} $window - the Angular $window service
   * @property {object} $q - the Angular Promise service
   * @property {object} smoothScroll - the ngSmoothScroll service
   * @property {boolean} prevArrowVisible - show/hide previous arrow
   * @property {boolean} nextArrowVisible - show/hide next arrow
   * @property {array} sections - the sections containing content
   * @property {number} currentSectionIdx - the index of the current section
   * @property {number} lastSectionIdx - the index of the last section
   */
  function LoginPageController($window, $q, smoothScroll) {
    this.$q = $q;
    this.$window = $window;
    this.smoothScroll = smoothScroll;

    this.prevArrowVisible = false;
    this.nextArrowVisible = false;

    this.sections = [];
    this.currentSectionIdx = 0;
    this.lastSectionIdx = 0;

    this.scrolling = $q.resolve();

    this.debouncedOnMouseWheel = _.debounce(this.onMouseWheel, 150);
  }

  angular.extend(LoginPageController.prototype, {
    /**
     * @function goToNextSection
     * @memberof app.view.LoginPageController
     * @description Scroll to the next section
     * @public
     */
    goToNextSection: function () {
      var that = this;
      that.scrolling = that.scrolling.then(function () {
        if (that.currentSectionIdx < that.lastSectionIdx) {
          that.currentSectionIdx += 1;
          var id = that.sections[that.currentSectionIdx].id;

          var scrollDeferred = that.$q.defer();
          var scrollOptions = {
            callbackAfter: function () {
              scrollDeferred.resolve();
            }
          };
          that.smoothScroll(that.$window.document.getElementById(id), scrollOptions);
          return scrollDeferred.promise;
        }
      });
    },
    /**
     * @function goToPrevSection
     * @memberof app.view.LoginPageController
     * @description Scroll back to previous section
     * @public
     */
    goToPrevSection: function () {
      var that = this;
      that.scrolling = that.scrolling.then(function () {
        var y = Math.floor(that.$window.scrollY || that.$window.pageYOffset) - 5;
        if (that.currentSectionIdx > 0 || y > 0) {
          var sectionTop = that.sections[that.currentSectionIdx].top;
          var diff = y <= sectionTop ? -1 : 0;
          that.currentSectionIdx += diff;
          var id = that.sections[that.currentSectionIdx].id;

          var scrollDeferred = that.$q.defer();
          var scrollOptions = {
            callbackAfter: function () {
              scrollDeferred.resolve();
            }
          };
          that.smoothScroll(that.$window.document.getElementById(id), scrollOptions);
          return scrollDeferred.promise;
        }
      });
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

      y += 5;   // add padding for zoom
      angular.forEach(this.sections, function (section, idx) {
        if (y >= section.top) {
          ctrl.currentSectionIdx = idx;
        }
      });
    },
    /**
     * @function onMouseWheel
     * @memberof app.view.LoginPageController
     * @description Handle mouse wheel events
     * @param {number} delta - the scroll event delta (amount + direction)
     * @public
     */
    onMouseWheel: function (delta) {
      if (delta < 0) {
        this.goToNextSection();
      } else {
        this.goToPrevSection();
      }
    }
  });

})();
