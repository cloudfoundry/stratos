(function () {
  'use strict';

  angular
    .module('app.view')
    .config(languageConfig)
    .factory('appSelectLanguage', selectLanguageFactory);

  var localeStorageId = 'locale';
  var defaultLocale = 'en_US';

  function languageConfig($translateProvider) {
    // Configure i18n
    $translateProvider.preferredLanguage(defaultLocale);
    $translateProvider.fallbackLanguage(defaultLocale);
    $translateProvider.useSanitizeValueStrategy(null);
  }

  /**
   * @name selectLanguageFactory
   * @description Factory to get the Language Selection App dialog
   * @constructor
   * @param {object} $q - the angular $q service
   * @param {object} $log - the angular $log service
   * @param {object} $translate - the i18n $translate service
   * @param {frameworkAsyncTaskDialog} frameworkAsyncTaskDialog - Async Task Dialog service
   * @param {appLocalStorage} appLocalStorage - service provides access to the local storage facility of the web browser
   */
  function selectLanguageFactory($q, $log, $translate, frameworkAsyncTaskDialog, appLocalStorage) {
    setLocale({
      currentLocale: appLocalStorage.getItem(localeStorageId)
    });

    function setLocale(data) {
      var locale = data.currentLocale;
      if (locale) {
        // Only store the locale if it's explicitly been set...
        appLocalStorage.setItem(localeStorageId, locale);
      } else {
        // .. otherwise use a best guess from the browser
        locale = $translate.resolveClientLocale().replace('-', '_');
      }
      // Take into account moment naming conventions. For a list of supported moment locales see
      // https://github.com/moment/moment/tree/2.10.6/locale
      var momentLocale = locale.replace('_', '-');
      // Moment calls 'en-US' just 'en'
      momentLocale = momentLocale === 'en-US' ? 'en' : momentLocale;

      if (locale === $translate.use() && momentLocale === moment.locale()) {
        return $q.resolve();
      }

      return $translate.use(locale).then(function () {
        $log.info("Changed locale to '" + $translate.use() + "'");
        var newMomentLocale = moment.locale(momentLocale);
        if (newMomentLocale === momentLocale) {
          $log.info("Changed moment locale to '" + newMomentLocale + "'");
        } else {
          $log.warn("Failed to load moment locale for '" + momentLocale + "', falling back to '" + newMomentLocale + "'");
        }
      }).catch(function (reason) {
        $log.warn("Failed to load language for locale '" + locale + "', falling back to '" + $translate.use() + "'");
        return $q.reject(reason);
      });
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
