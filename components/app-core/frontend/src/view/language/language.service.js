(function () {
  'use strict';

  angular
    .module('app.view')
    .config(languageConfig)
    .provider('languageService', languageServiceProvider)
    .factory('missingTranslateHandler', missingTranslateHandler);

  var localeStorageId = 'stratos-ui_locale';
  var defaultLocale = 'en_US';
  var browserLocale;

  /**
   * @namespace app.utils.languageConfig
   * @memberof app.view
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

    $translateProvider.useMissingTranslationHandler('missingTranslateHandler');
  }

  /**
   * @namespace app.view.missingTranslateHandler
   * @memberof app.view
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
   * @namespace app.view.languageServiceProvider
   * @memberof app.view
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
   * @namespace app.view.languageServiceFactory
   * @memberof app.view
   * @name languageServiceFactory
   * @param {object} $q - the angular $q service
   * @param {object} $log - the angular $log service
   * @param {object} $translate - the i18n $translate service
   * @param {frameworkAsyncTaskDialog} frameworkAsyncTaskDialog - the i18n $translate service
   * @param {modelManager} modelManager - the model manager service
   * @param {appLocalStorage} appLocalStorage - service provides access to the local storage facility of the web browser
   * @returns {object} Language Service
   */
  function languageServiceFactory($q, $log, $translate, frameworkAsyncTaskDialog, modelManager, appLocalStorage) {

    var userPreference = appLocalStorage.getItem(localeStorageId);

    // Determine if there is only one locale which the user should always use
    var locales = _getLocales();
    if (locales.length === 1) {
      $log.debug('Only 1 locale found, setting to preferred + fallback: ', locales[0]);
      // Attempt to set the fallback + preferred
      $translate.preferredLanguage(locales[0]);
      $translate.useFallbackLanguage(locales[0]);
      // Ensure that the user pref is this one. This avoids instances where older, unsupported locales have not been
      // cleared out of the source tree
      userPreference = locales[0];
    }

    // Ensure that the locale is set to the user's pref (or forced to the only locale)
    _setLocale({
      currentLocale: userPreference
    });

    var service = {
      /**
       * @name enableLanguageSelection
       * @description Defines if language selection is enabled
       * @returns {boolean} true if the language can be selected
       */
      enableLanguageSelection: enableLanguageSelection,
      /**
       * @name showLanguageSelection
       * @description Display Language Selection Dialog
       * @returns {*} frameworkAsyncTaskDialog
       */
      showLanguageSelection: showLanguageSelection,
      /**
       * @name getCurrent
       * @description Gets the current language
       * @returns {string} the current language
       */
      getCurrent: getCurrent
    };

    if (enableLanguageSelection()) {
      var userNavModel = modelManager.retrieve('app.model.navigation').user;
      var item = userNavModel.addMenuItemFunction('select-language', service.showLanguageSelection, 'menu.language', 2);
      item.setTextValues(function () {
        return { current: service.getCurrent() };
      });
    }

    return service;

    function _setLocale(data) {
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
        $log.debug("Changed locale to '" + $translate.use() + "'");
        var newMomentLocale = moment.locale(momentLocale);
        if (newMomentLocale === momentLocale) {
          $log.debug("Changed moment locale to '" + newMomentLocale + "'");
        } else {
          $log.warn("Failed to load moment locale for '" + momentLocale + "', falling back to '" + newMomentLocale + "'");
        }
      }).catch(function (reason) {
        $log.warn("Failed to load language for locale '" + locale + "', falling back to '" + $translate.use() + "'");
        return $q.reject(reason);
      });
    }

    function _getLocales() {
      var locales = $translate.instant('locales');
      return locales ? locales.split(',') : [];
    }

    function enableLanguageSelection() {
      return _getLocales().length > 1;
    }

    function showLanguageSelection() {
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
          templateUrl: 'app/view/language/select-language.html',
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
        _setLocale
      );
    }

    function getCurrent() {
      return $translate.instant('locales.' + $translate.use());
    }
  }

})();
