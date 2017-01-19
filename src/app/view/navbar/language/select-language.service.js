(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.selectLanguage', selectLanguageFactory);

  selectLanguageFactory.$inject = [
    '$translate',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @name selectLanguageFactory
   * @description Factory to get the Language Selection App dialog
   * @constructor
   * @param {object} $translate - the i18n $translate service
   * @param {helion.framework.widgets.asyncTaskDialog} asyncTaskDialog - Async Task Dialog service
   */
  function selectLanguageFactory($translate, asyncTaskDialog) {
    return {
      /**
       * @name show
       * @description Display Language Selection Dialog
       * @returns {*} asyncTaskDialog
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
          return $translate.use(data.currentLocale);
        };

        return asyncTaskDialog(
          {
            title: 'Select Langauge',
            templateUrl: 'app/view/navbar/language/select-language.html',
            submitCommit: true,
            buttonTitles: {
              submit: 'Set'
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
