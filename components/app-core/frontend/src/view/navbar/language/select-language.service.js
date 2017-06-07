(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('appSelectLanguage', selectLanguageFactory);

  /**
   * @name selectLanguageFactory
   * @description Factory to get the Language Selection App dialog
   * @constructor
   * @param {object} $translate - the i18n $translate service
   * @param {app.framework.widgets.frameworkAsyncTaskDialog} frameworkAsyncTaskDialog - Async Task Dialog service
   */
  function selectLanguageFactory($translate, frameworkAsyncTaskDialog) {
    return {
      /**
       * @name show
       * @description Display Language Selection Dialog
       * @returns {*} frameworkAsyncTaskDialog
       */
      show: function () {
        var locales = [];
        _.each($translate.instant('locales').split(','), function (locale) {
          locales.push({
            value: locale.trim(),
            label: $translate.instant('locales.' + locale.trim())
          });
        });

        var setLocalePromise = function (data) {
          $translate.fallbackLanguage('en');
          return $translate.use(data.currentLocale);
        };

        return frameworkAsyncTaskDialog(
          {
            title: 'language.select',
            templateUrl: 'app/view/navbar/language/select-language.html',
            submitCommit: true,
            buttonTitles: {
              submit: 'buttons.set'
            },
            class: 'dialog-form',
            dialog: true
          },
          {
            data: {
              locales: locales,
              currentLocale: $translate.use()
            }
          },
          setLocalePromise
        );
      }
    };
  }
})();
