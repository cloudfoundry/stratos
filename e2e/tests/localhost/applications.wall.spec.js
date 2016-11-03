'use strict';

var utils = require('../../utils');
var loginPage = require('../../po/login-page.po');

describe('Application wall', function () {
  beforeAll(function () {
    utils.loadE2eClient();
  });

  afterAll(function () {
    utils.unloadE2eClient();
  });

  describe('When cluster is not ready', function () {
    beforeAll(function () {
      utils.loadWith('app-wall/no-clusters');
    });

    it('The page should have title Applications.', function () {
      expect(element(by.css('.applications-header')).getText()).toBe('Applications');
    });

    it('should show application message: "You cannot view any applications."', function () {
      var msgElem = element(by.css('.applications-msg'));
      expect(msgElem.isPresent()).toBeTruthy();
      expect(msgElem.getText()).toBe('You cannot view any applications.');
    });

    it('should not see ADD APPLICATION botton.', function () {
      expect(element(by.css('.btn.btn-primary')).isPresent()).not.toBeTruthy();
    });
  });

  describe('When there is no applications', function () {
    beforeAll(function () {
      utils.loadWith('app-wall/no-apps');
    });

    it('The page should have title Applications.', function () {
      expect(element(by.css('.applications-header')).getText()).toBe('Applications');
    });

    it('should show application message: "You have no applications and cannot add any."', function () {
      var msgElem = element(by.css('.applications-msg'));
      expect(msgElem.isPresent()).toBeTruthy();
      expect(msgElem.getText()).toBe('You have no applications and cannot add any.');
    });
  });

  describe('When there are 3 applications in total, user', function () {
    beforeAll(function () {
      utils.loadWith('app-wall/3-apps');
    });

    it('The page should have title Applications.', function () {
      expect(element(by.css('.applications-header')).getText()).toBe('Applications');
    });

    it('should see an ADD APPLICATION button.', function () {
      var btn = element(by.css('.btn.btn-primary'));
      expect(btn.isPresent()).toBeTruthy();
      expect(btn.getText()).toBe('ADD APPLICATION');
    });

    it('should not see no-application message.', function () {
      expect(element(by.css('.applications-msg')).isPresent()).toBe(false);
    });

    it('should not see any paginator.', function () {
      expect(element(by.css('.paginator')).isPresent()).toBe(false);
    });

    it('should see 3 applications on the wall, and ordered correctly', function () {
      element.all(by.css('.app-gallery-card')).then(function (items) {
        expect(items.length).toBe(3);
        expect(items[0].element(by.css('.gallery-card-title')).getText()).toBe('abc');
        expect(items[1].element(by.css('.gallery-card-title')).getText()).toBe('opq');
        expect(items[2].element(by.css('.gallery-card-title')).getText()).toBe('xyz');
      });
    });
  });

  describe('When there are 500 applications in total, user', function () {
    beforeAll(function () {
      utils.loadWith('app-wall/500-apps');
    });

    it('The page should have title Applications.', function () {
      expect(element(by.css('.applications-header')).getText()).toBe('Applications');
    });

    it('should see paginator.', function () {
      expect(element(by.css('.paginator')).isPresent()).toBe(true);
    });

    it('should see 11 pages available to navigate.', function () {
      element.all(by.css('.paginator .page-links span')).then(function (items) {
        expect(items[6].getText()).toBe('11');
      });
    });

    it('should see 48 applications on the wall.', function () {
      element.all(by.css('.app-gallery-card')).then(function (items) {
        expect(items.length).toBe(48);
      });
    });

    it('should see the current page is page 1.', function () {
      element.all(by.css('.paginator .page-links .current')).then(function (items) {
        expect(items.length).toBe(1);
        expect(items[0].getText()).toBe('1');
      });
    });

    it('should see other buttons in paginator populated correctly.', function () {
      element.all(by.css('.paginator .page-links span')).then(function (items) {
        expect(items.length).toBe(7);
        expect(items[0].getText()).toBe('1');
        expect(items[1].getText()).toBe('2');
        expect(items[2].getText()).toBe('3');
        expect(items[3].getText()).toBe('4');
        expect(items[4].getText()).toBe('5');
        expect(items[5].getText()).toBe('...');
        expect(items[6].getText()).toBe('11');
      });
    });

    it('should see a Previous link button', function () {
      var prevBtn = element(by.css('.btn-link.btn-prev'));
      expect(prevBtn.isPresent()).toBe(true);
      expect(prevBtn.getText()).toBe('Previous');
    });

    it('should see a Next link button', function () {
      var nextBtn = element(by.css('.btn-link.btn-next'));
      expect(nextBtn.isPresent()).toBe(true);
      expect(nextBtn.getText()).toBe('Next');
    });

    describe('Then after client on Next button', function () {
      beforeAll(function () {
        element(by.css('.btn-link.btn-next')).click();
      });

      it('should see 48 applications on the wall.', function () {
        element.all(by.css('.app-gallery-card')).then(function (items) {
          expect(items.length).toBe(48);
        });
      });

      it('should see the current page is page 11.', function () {
        element.all(by.css('.paginator .page-links .current')).then(function (items) {
          expect(items.length).toBe(1);
          expect(items[0].getText()).toBe('2');
        });
      });

      it('should see other buttons in paginator populated correctly.', function () {
        element.all(by.css('.paginator .page-links span')).then(function (items) {
          expect(items.length).toBe(7);
          expect(items[0].getText()).toBe('1');
          expect(items[1].getText()).toBe('2');
          expect(items[2].getText()).toBe('3');
          expect(items[3].getText()).toBe('4');
          expect(items[4].getText()).toBe('5');
          expect(items[5].getText()).toBe('...');
          expect(items[6].getText()).toBe('11');
        });
      });
    });

    describe('After client on 11 page button', function () {
      beforeAll(function () {
        element.all(by.css('.paginator .page-links span')).then(function (items) {
          items[6].click();
        });
      });

      it('should see 20 applications on the wall.', function () {
        element.all(by.css('.app-gallery-card')).then(function (items) {
          expect(items.length).toBe(20);
        });
      });

      it('should see the current page is page 11.', function () {
        element.all(by.css('.paginator .page-links .current')).then(function (items) {
          expect(items.length).toBe(1);
          expect(items[0].getText()).toBe('11');
        });
      });

      it('should see other buttons in paginator populated correctly.', function () {
        element.all(by.css('.paginator .page-links span')).then(function (items) {
          expect(items.length).toBe(7);
          expect(items[0].getText()).toBe('1');
          expect(items[1].getText()).toBe('...');
          expect(items[2].getText()).toBe('7');
          expect(items[3].getText()).toBe('8');
          expect(items[4].getText()).toBe('9');
          expect(items[5].getText()).toBe('10');
          expect(items[6].getText()).toBe('11');
        });
      });
    });

    describe('Then after client on Previous button', function () {
      beforeAll(function () {
        element(by.css('.btn-link.btn-prev')).click();
      });

      it('should see 48 applications on the wall.', function () {
        element.all(by.css('.app-gallery-card')).then(function (items) {
          expect(items.length).toBe(48);
        });
      });

      it('should see the current page is page 11.', function () {
        element.all(by.css('.paginator .page-links .current')).then(function (items) {
          expect(items.length).toBe(1);
          expect(items[0].getText()).toBe('10');
        });
      });

      it('should see other buttons in paginator populated correctly.', function () {
        element.all(by.css('.paginator .page-links span')).then(function (items) {
          expect(items.length).toBe(7);
          expect(items[0].getText()).toBe('1');
          expect(items[1].getText()).toBe('...');
          expect(items[2].getText()).toBe('7');
          expect(items[3].getText()).toBe('8');
          expect(items[4].getText()).toBe('9');
          expect(items[5].getText()).toBe('10');
          expect(items[6].getText()).toBe('11');
        });
      });
    });
  });
});
