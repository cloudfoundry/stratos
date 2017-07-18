(function () {
  'use strict';

  angular
    .module('app.utils')
    .config(languageConfig)
    .provider('languageService', languageServiceProvider)
    .factory('missingTranslateHandler', missingTranslateHandler);

  var localeStorageId = 'locale';
  var defaultLocale = 'en_US';
  var browserLocale;

  /**
   * @namespace app.utils.languageConfig
   * @memberof app.utils
   * @name missingTranslateHandler
   * @description Initialise the $translate service with the required config
   * @param {object} $translateProvider - the angular $translateProvider provider
   */
  function languageConfig($translateProvider) {
    // Configure i18n
    $translateProvider.preferredLanguage(defaultLocale);
    $translateProvider.fallbackLanguage(defaultLocale);
    $translateProvider.useSanitizeValueStrategy(null);

    $translateProvider.useStaticFilesLoader({
      prefix: '/i18n/locale-',
      suffix: '.json'
    });

    // Uncomment this for development to see which strings need localizing
    $translateProvider.useMissingTranslationHandler('missingTranslateHandler');
  }

  /**
   * @namespace app.utils.missingTranslateHandler
   * @memberof app.utils
   * @name missingTranslateHandler
   * @description Custom missing translation handler only logs each missing translation id once
   * @param {object} $log - the angular $log service
   * @returns {function} Handler for missing translations
   */
  function missingTranslateHandler($log) {

    var seen = {};

    return function (translationId) {
      if (!seen[translationId]) {
        $log.warn('Missing translation for "' + translationId + '"');
        seen[translationId] = true;
      }

      // Highlight missing translations (breaks unit tests)
      //return '<span class="i18n-missing">' + translationId + '</span>';
    };
  }

  /**
   * @namespace app.utils.languageServiceProvider
   * @memberof app.utils
   * @name languageServiceProvider
   * @description Provide a way to override the default browser locale
   * @returns {object} language service provider
   */
  function languageServiceProvider() {
    var provider = this;

    provider.$inject = ['$q', '$log', '$translate', 'appLocalStorage'];

    return {
      setBrowserLocale: setBrowserLocale,
      getBrowserLocale: getBrowserLocale,
      $get: languageServiceFactory
    };

    function setBrowserLocale(locale) {
      browserLocale = locale;
    }

    function getBrowserLocale() {
      return browserLocale;
    }
  }

  /**
   * @namespace app.utils.languageServiceFactory
   * @memberof app.utils
   * @name languageServiceFactory
   * @param {object} $q - the angular $q service
   * @param {object} $log - the angular $log service
   * @param {object} $translate - the i18n $translate service
   * @param {appLocalStorage} appLocalStorage - service provides access to the local storage facility of the web browser
   * @returns {object} Logged In Service
   */
  function languageServiceFactory($q, $log, $translate, appLocalStorage) {

    setLocale({
      currentLocale: appLocalStorage.getItem(localeStorageId)
    });

    return {
      setLocale: setLocale
    };

    function setLocale(data) {
      var locale = data.currentLocale;
      if (locale) {
        // Only store the locale if it's explicitly been set...
        appLocalStorage.setItem(localeStorageId, locale);
      } else {
        // .. otherwise use a best guess from the browser
        locale = browserLocale || $translate.resolveClientLocale();
        locale = locale.replace('-', '_');
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
  }

})();
