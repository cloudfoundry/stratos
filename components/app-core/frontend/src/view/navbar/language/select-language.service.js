(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('appSelectLanguage', selectLanguageFactory);

  var localeStorageId = 'locale';

  /**
   * @name selectLanguageFactory
   * @description Factory to get the Language Selection App dialog
   * @constructor
   * @param {object} $translate - the i18n $translate service
   * @param {frameworkAsyncTaskDialog} frameworkAsyncTaskDialog - Async Task Dialog service
   * @param {appLocalStorage} appLocalStorage - service provides access to the local storage facility of the web browser
   */
  function selectLanguageFactory($translate, frameworkAsyncTaskDialog, appLocalStorage) {

    // TODO: RC Detect from browser/os??
    var defaultLocale = 'en';

    setLocale({
      currentLocale: appLocalStorage.getItem(localeStorageId, defaultLocale)
    });

    function setLocale(data) {
      var locale = data.currentLocale;
      $translate.fallbackLanguage('en');
      appLocalStorage.setItem(localeStorageId, locale);
      return $translate.use(locale);
    }

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
          setLocale
        );
      },
      getCurrent: function () {
        return $translate.instant('locales.' + $translate.use());
      }
    };
  }
})();
