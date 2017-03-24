(function () {
  'use strict';

  describe('gallery-card directive', function () {
    var $compile;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
    }));

    describe('with default settings', function () {
      var $scope, element, galleryCardCtrl;

      beforeEach(inject(function ($injector) {
        $scope = $injector.get('$rootScope').$new();
        $scope.mockData = {title: 'App 1'};

        var markup = '<gallery-card card-data="mockData">Content</gallery-card>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        galleryCardCtrl = element.controller('galleryCard');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should use default icon for actions dropdown', function () {
        expect(galleryCardCtrl.actionsIcon).toBe('glyphicon glyphicon-option-horizontal');
      });

      it('should not show actions menu component', function () {
        expect(galleryCardCtrl.cardActions).toBeUndefined();
        expect(element.find('actions-menu').length).toBe(0);
      });

      it('should have title `MyCardTitle`', function () {
        var title = angular.element(element[0].querySelector('.gallery-card-title'));
        expect(title.text().trim()).toBe('App 1');
      });

      it('should have transcluded content `Content`', function () {
        expect(element.find('ng-transclude').text().trim()).toBe('Content');
      });

      it('should have `onCardClick` defined', function () {
        expect(galleryCardCtrl.onCardClick).toBeDefined();
      });

      it('should have `onNotificationClick` defined', function () {
        expect(galleryCardCtrl.onNotificationClick).toBeDefined();
      });
    });

    describe('with custom options', function () {
      var $scope, element, galleryCardCtrl;

      beforeEach(inject(function ($injector) {
        $scope = $injector.get('$rootScope').$new();
        $scope.mockData = {title: 'App 1', link: '#foo'};
        $scope.mockClick = angular.noop;
        $scope.mockActions = [
          {
            name: 'Start', execute: angular.noop
          },
          {
            name: 'Stop', execute: angular.noop
          }
        ];

        var markup = '<gallery-card card-data="mockData" card-actions-icon="foo" ' +
          'on-card-click="mockClick(card)" on-notification-click="mockClick(card)" ' +
          'card-actions="mockActions">' +
          'Content' +
          '</gallery-card>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        galleryCardCtrl = element.controller('galleryCard');
        spyOn(galleryCardCtrl, 'onCardClick');
        spyOn(galleryCardCtrl, 'onNotificationClick');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should use specified icon for actions dropdown', function () {
        expect(galleryCardCtrl.actionsIcon).toBe('foo');
      });

      it('should show actions menu component', function () {
        expect(galleryCardCtrl.cardActions).toBeDefined();
        expect(element.find('actions-menu').length).toBe(1);
      });

      it('should update card status bar when card-status defined', function () {
        expect(galleryCardCtrl.cardData.status).toBeUndefined();

        $scope.mockData.status = {
          description: 'Warning!',
          classes: 'warning',
          icon: 'warning-icon'
        };
        $scope.$apply();

        expect(galleryCardCtrl.cardData.status.description).toBe('Warning!');
        expect(galleryCardCtrl.cardData.status.classes).toBe('warning');
        expect(galleryCardCtrl.cardData.status.icon).toBe('warning-icon');

        var statusBar = angular.element(element[0].querySelector('.panel-footer'));
        expect(statusBar.text().trim()).toBe('Warning!');

        var statusIcon = angular.element(statusBar[0].querySelector('.gallery-card-status'));
        expect(statusIcon.hasClass('warning')).toBeTruthy();
        expect(statusIcon.find('span').hasClass('warning-icon')).toBeTruthy();
      });

      it('should call cardClicked() when body clicked', function () {
        var body = angular.element(element[0].querySelector('.panel-body'));
        body.triggerHandler('click');

        expect(galleryCardCtrl.onCardClick).toHaveBeenCalled();
      });

      it('should call notificationClicked() when status bar clicked', function () {
        $scope.mockData.status = {
          description: 'Warning!',
          classes: 'warning',
          icon: 'warning-icon'
        };
        $scope.$apply();

        var footer = angular.element(element[0].querySelector('.panel-footer'));
        footer.triggerHandler('click');

        expect(galleryCardCtrl.onNotificationClick).toHaveBeenCalled();
      });
    });
  });

})();
