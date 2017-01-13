/* eslint-disable angular/window-service */
(function () {
  'use strict';

  describe('local storage service', function () {

    describe('when local storage is not defined', function () {
      var localStorage;

      beforeEach(function () {
        module(function ($provide) {
          $provide.value('$window', {
            env: {
              OEM_CONFIG: {}
            }
          });
        });
      });

      beforeEach(module('templates'));
      beforeEach(module('green-box-console'));

      beforeEach(inject(function ($injector) {
        localStorage = $injector.get('app.view.localStorage');
      }));

      it('should not be supported', function () {
        expect(localStorage).toBeDefined();
        expect(localStorage.isSupported()).toBe(false);
      });
    });

    describe('when local storage is not available', function () {
      var localStorage;

      beforeEach(function () {
        spyOn(window.localStorage, 'setItem').and.throwError();
      });

      beforeEach(module('templates'));
      beforeEach(module('green-box-console'));

      beforeEach(inject(function ($injector) {
        localStorage = $injector.get('app.view.localStorage');
      }));

      it('should not be supported', function () {
        expect(localStorage).toBeDefined();
        expect(localStorage.isSupported()).toBe(false);
      });

      it('should always return default value', function () {
        localStorage.setItem('test_key', 'test_value_12345');
        expect(localStorage.getItem('test_key', 'test_default_value')).toBe('test_default_value');
      });

      it('should ignore removing an item', function () {
        localStorage.removeItem('test_key');
      });
    });

    describe('when local storage is available', function () {
      var localStorage;

      beforeEach(module('templates'));
      beforeEach(module('green-box-console'));

      beforeEach(inject(function ($injector) {
        localStorage = $injector.get('app.view.localStorage');
      }));

      it('should be defined', function () {
        expect(localStorage).toBeDefined();
      });

      it('should be supported', function () {
        expect(localStorage.isSupported()).toBe(true);
      });

      it('should be able to set and retrieve an item', function () {
        localStorage.setItem('test_key', 'test_value_12345');
        expect(localStorage.getItem('test_key')).toBe('test_value_12345');
      });

      it('should return default value if no value is stored for an item', function () {
        expect(localStorage.getItem('test_key_not_found', 'test_6789')).toBe('test_6789');
      });

      it('should be able to remove an item', function () {
        localStorage.setItem('test_key', 'test_value_12345');
        expect(localStorage.getItem('test_key')).toBe('test_value_12345');
        localStorage.removeItem('test_key');
        expect(localStorage.getItem('test_key')).not.toBeDefined();
      });
    });
  });
})();
