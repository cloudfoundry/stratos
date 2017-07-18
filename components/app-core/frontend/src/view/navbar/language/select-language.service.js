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
   * @param {frameworkAsyncTaskDialog} frameworkAsyncTaskDialog - Async Task Dialog service
   * @param {object} languageService - language
   */
  function selectLanguageFactory($translate, frameworkAsyncTaskDialog, languageService) {

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
          languageService.setLocale
        );
      },
      getCurrent: function () {
        return $translate.instant('locales.' + $translate.use());
      }
    };
  }
})();
