/* eslint-disable angular/di, angular/window-service, no-eval */
(function () {
  'use strict';

  var toSrc = require('../../tools/node_modules/toSrc');
  var _ = require('../../tools/node_modules/lodash');
  var angularMocks = require('./angular-mocks.po');

  var ngMockE2E = {

    /**
     * @type {!Object.<function>}
     * @private
     */
    mockModules_: {
      addMockModule: function () {
        angular.module('ngMockE2E_', []);
      }
    },

    /**
     * Init the ngMock E2E library
     */
    init: function () {
      ngMockE2E.addMockModule();
      browser.addMockModule('ngMockE2E', angularMocks);
    },

    unload: function () {
      browser.removeMockModule('ngMockE2E');
      browser.removeMockModule('ngMockE2E_');
    },

    addMockModule: function () {
      browser.addMockModule('ngMockE2E_', ngMockE2E.mockModules_.addMockModule);
    },

    $httpBackend: {
      mockModules_: {

        when: function (whenArgumentsEvaluativeJavaScript, requestHandlerKey) {
          angular.module('ngMockE2E').run(['$httpBackend', function ($httpBackend) {
            if (!window.requestHandlers_) {
              window.requestHandlers_ = {};
            }
            var whenArguments = whenArgumentsEvaluativeJavaScript.map(function (src) {
              var value;
              eval('value = ' + src);
              return value;
            });
            var requestHandler = $httpBackend.when.apply($httpBackend, whenArguments);
            window.requestHandlers_[requestHandlerKey] = requestHandler;
          }]);
        },

        whenRespond: function (respondArgumentsEvaluativeJavaScript, requestHandlerKey) {
          angular.module('ngMockE2E').run(function () {
            var requestHandler = window.requestHandlers_[requestHandlerKey];
            var respondArguments = respondArgumentsEvaluativeJavaScript.map(function (sourceCode) {
              var value;
              eval('value = ' + sourceCode);
              return value;
            });
            requestHandler.respond.apply(requestHandler, respondArguments);
          });
        },

        whenPassThrough: function (requestHandlerKey) {
          angular.module('ngMockE2E').run(function () {
            var requestHandler = window.requestHandlers_[requestHandlerKey];
            requestHandler.passThrough();
          });
        },

        passThrough: function () {
          angular.module('ngMockE2E').run(function ($httpBackend) {
            var ANY_URL = /.*/;
            $httpBackend.whenGET(ANY_URL).passThrough();
            $httpBackend.whenHEAD(ANY_URL).passThrough();
            $httpBackend.whenDELETE(ANY_URL).passThrough();
            $httpBackend.whenPOST(ANY_URL).passThrough();
            $httpBackend.whenPUT(ANY_URL).passThrough();
            $httpBackend.whenPATCH(ANY_URL).passThrough();
          });
        }
      },

      requestHandlerKey_: 0,

      getUniqueRequestHandlerKey_: function () {
        ngMockE2E.$httpBackend.requestHandlerKey_ = ngMockE2E.$httpBackend.requestHandlerKey_ + 1;
        return ngMockE2E.$httpBackend.requestHandlerKey_;
      },

      convertArgumentsToArray_: function (args) {
        return Array.prototype.slice.call(args);
      },

      convertArrayElementsToJavaScriptCode_: function (array) {
        return array.map(function (element) {
          return toSrc(element, 1000);
        });
      },

      when: function () {
        var whenArguments = ngMockE2E.$httpBackend.convertArgumentsToArray_(arguments);
        var whenArgumentsEvaluativeJavaScript = ngMockE2E.$httpBackend.convertArrayElementsToJavaScriptCode_(whenArguments);
        var requestHandlerKey = this.getUniqueRequestHandlerKey_();
        browser.addMockModule('ngMockE2E_', ngMockE2E.$httpBackend.mockModules_.when, whenArgumentsEvaluativeJavaScript, requestHandlerKey);

        return {
          respond: function () {
            var respondArguments = ngMockE2E.$httpBackend.convertArgumentsToArray_(arguments);
            var respondArgumentsEvaluativeJavaScript = ngMockE2E.$httpBackend.convertArrayElementsToJavaScriptCode_(respondArguments);
            browser.addMockModule('ngMockE2E_', ngMockE2E.$httpBackend.mockModules_.whenRespond, respondArgumentsEvaluativeJavaScript, requestHandlerKey);
          },

          passThrough: function () {
            browser.addMockModule('ngMockE2E_', ngMockE2E.$httpBackend.mockModules_.whenPassThrough, requestHandlerKey);
          }
        };
      },

      passThrough: function () {
        browser.addMockModule('ngMockE2E_', ngMockE2E.$httpBackend.mockModules_.passThrough);
      }
    }
  };

  module.exports = ngMockE2E;

  // Helpers
  ngMockE2E.$httpBackend.whenGET = _.partial(ngMockE2E.$httpBackend.when, 'GET');
  ngMockE2E.$httpBackend.whenPOST = _.partial(ngMockE2E.$httpBackend.when, 'POST');

})();
