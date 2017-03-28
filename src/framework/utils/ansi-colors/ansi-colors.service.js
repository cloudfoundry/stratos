(function () {
  'use strict';
  /* eslint-disable angular/no-service-method */
  angular
    .module('helion.framework.utils')
    .service('AnsiColorsService', ansiColorsService);
  /* eslint-enable angular/no-service-method */

  ansiColorsService.$inject = [];

  /**
   * @name ansiColorsService
   * @namespace helion.framework.utils.ansiColorsService
   * @memberof helion.framework.utils
   * @description replaces ANSI color escape sequences with wrapping <span> elements
   */
  function ansiColorsService() {

    // Map of ANSI foreground color codes to color names
    var fgAnsiToNames = {
      30: 'black',
      31: 'red',
      32: 'green',
      33: 'yellow',
      34: 'blue',
      35: 'magenta',
      36: 'cyan',
      37: 'white'
    };

    // Map of ANSI background color codes to color names
    var bgAnsiToNames = {};
    for (var ansiColor in fgAnsiToNames) {
      if (!fgAnsiToNames.hasOwnProperty(ansiColor)) {
        continue;
      }
      bgAnsiToNames[parseInt(ansiColor, 10) + 10] = fgAnsiToNames[ansiColor];
    }

    /* eslint-disable no-control-regex */
    var ansiEscapeMatcher = new RegExp('(?:\x1B\\[[0-9;]*m[\n]*)+', 'g');
    var ansiEscapeExtractor = new RegExp('\x1B\\[([0-9;]*)m([\n]*)', 'g');
    /* eslint-enable no-control-regex */

    this.spanOpen = false;
    this.currentFg = null;
    this.currentBg = null;
    this.boldOn = false;

    function AnsiColorizer() {
      angular.extend(this);
    }

    AnsiColorizer.prototype = {
      reset: function () {
        this.currentFg = null;
        this.currentBg = null;
        this.boldOn = false;
      },

      makeSpan: function () {

        var span = '';
        if (this.boldOn || this.currentFg || this.currentBg) {
          span += '<span class="';
          if (this.boldOn) {
            span += 'intense ';
          }
          if (this.currentFg) {
            span += 'ansi-';
            span += fgAnsiToNames[this.currentFg];
            span += ' ';
          }
          if (this.currentBg) {
            span += 'ansi-background-';
            span += bgAnsiToNames[this.currentBg];
          }
          span += '">';
        }

        var close = '';
        if (span !== this.spanOpen) {
          // Close previous span if required
          if (this.spanOpen) {
            close = '</span>';
          }
          this.spanOpen = span;
        } else {
          // $log.debug('Re-using identical open span!: ' + span);
          span = '';
        }

        return close + span;
      },

      smartReplacer: function (match) {
        // First flatten all consecutive mode switches into a single string
        var modes = match.replace(ansiEscapeExtractor, this.ansiGroupParser.bind(this)).split(';');
        var lineFeeds = '';

        // Support n-modes switching like a real terminal
        for (var i = 0; i < modes.length - 1; i++) {
          var mode = parseInt(modes[i], 10);

          // Handle line feeds
          if (mode < 0) {
            for (var n = mode; n < 0; n++) {
              lineFeeds += '\n';
            }
            continue;
          }

          this.handleMode(mode);
        }
        // Return a single span with the correct classes for all consecutive SGR parameters
        return this.makeSpan() + lineFeeds;
      },

      handleMode: function (mode) {
        switch (mode) {
          // Reset all
          case 0:
            this.reset();
            break;
          // Enable bold
          case 1:
            this.boldOn = true;
            break;
          // Disable bold
          case 22:
            this.boldOn = false;
            break;
          // Reset foreground
          case 39:
            this.currentFg = null;
            break;
          // Reset background
          case 49:
            this.currentBg = null;
            break;
          default:
            if (mode <= 37 && mode >= 30) {
              // Normal foreground color
              this.currentFg = mode;
            } else if (mode <= 47 && mode >= 40) {
              // Background color
              this.currentBg = mode;
            }
            break;
        }
      },

      ansiGroupParser: function (match, graphicModes, lineFeeds) {
        var ret = '';
        if (lineFeeds) {
          ret += -lineFeeds.length + ';';
        }
        if (!graphicModes) {
          // An empty mode string means reset all
          return ret + '0;';
        }

        // Non empty modes processed as normal
        return ret + graphicModes + ';';

      },

      ansiColorsToHtml: function (str) {
        // $log.debug('Calling replacer on String: ' + '\n---\n' + str + '\n---\n');
        str = str.replace(/</g, '&lt;'); // Escape embedded markup
        return str.replace(ansiEscapeMatcher, this.smartReplacer.bind(this));
      }
    };

    this.getInstance = function () {
      return new AnsiColorizer();
    };

  }

})();
