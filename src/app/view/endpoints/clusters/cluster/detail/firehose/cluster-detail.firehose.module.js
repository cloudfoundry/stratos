(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.detail.firehose', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.firehose', {
      url: '/firehose',
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/firehose/cluster-detail-firehose.html',
      controller: ClusterFirehoseController,
      controllerAs: 'firehoseCtrl',
      ncyBreadcrumb: {
        label: '{{ clusterController.userServiceInstanceModel.serviceInstances[clusterController.guid].name ||"..." }}',
        parent: function () {
          return 'endpoint.clusters.tiles';
        }
      }
    });
  }

  ClusterFirehoseController.$inject = [
    'base64',
    'app.utils.utilsService',
    'app.view.localStorage',
    '$scope',
    '$stateParams',
    '$location',
    '$log',
    '$document',
    '$timeout',
    '$animate'
  ];

  function ClusterFirehoseController(base64, utils, localStorage,
                                     $scope, $stateParams, $location, $log, $document, $timeout, $animate) {
    var vm = this;

    /* eslint-disable no-control-regex */
    var ANSI_ESCAPE_MATCHER = new RegExp('\x1B\\[([0-9;]*)m', 'g');
    /* eslint-enable no-control-regex */

    // Methods for HttpStartStop Events
    var HTTP_METHODS = [
      'GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'ACL', 'BASELINE_CONTROL', 'BIND', 'CHECKIN', 'CHECKOUT', 'CONNECT',
      'COPY', 'DEBUG', 'LABEL', 'LINK', 'LOCK', 'MERGE', 'MKACTIVITY', 'MKCALENDAR', 'MKCOL', 'MKREDIRECTREF',
      'MKWORKSPACE', 'MOVE', 'OPTIONS', 'ORDERPATCH', 'PATCH', 'PRI', 'PROPFIND', 'PROPPATCH', 'REBIND', 'REPORT',
      'SEARCH', 'SHOWMETHOD', 'SPACEJUMP', 'TEXTSEARCH', 'TRACE', 'TRACK', 'UNBIND', 'UNCHECKOUT', 'UNLINK', 'UNLOCK',
      'UPDATE', 'UPDATEREDIRECTREF', 'VERSION_CONTROL'
    ];

    var defaultFilters = {
      api: true,
      apps: true,
      metrics: true,
      counters: true,
      errors: true,
      containerMetrics: true,
      others: true
    };

    var coloredLog = utils.coloredLog;

    try {
      var fromStore = angular.fromJson(localStorage.getItem('firehose-filters', defaultFilters));
      // Ensure properties are clean after upgrades or in case local storage was tampered with
      vm.hoseFilters = _.pick(fromStore, Object.keys(defaultFilters));
      _.defaults(vm.hoseFilters, defaultFilters);
    } catch (error) {
      vm.hoseFilters = defaultFilters;
    }

    var theElement = angular.element('#firehose-container')[0];
    $animate.enabled(false, theElement);

    vm.textFilter = {
      matchCase: false,
      highlightMatches: true
    };

    vm.showAll = function (onOff) {
      for (var key in vm.hoseFilters) {
        if (!vm.hoseFilters.hasOwnProperty(key)) { continue; }
        vm.hoseFilters[key] = onOff;
      }
    };

    vm.fullScreenOn = function () {
      vm.fullScreen = true;
    };

    vm.fullScreenOff = function () {
      vm.fullScreen = false;
    };

    function keyHandler(e) {
      if (e.keyCode === 27 && vm.fullScreen) {
        e.stopPropagation();
        e.preventDefault();
        $scope.$apply(function () {
          vm.fullScreen = false;
        });
        return true;
      }
    }

    var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
    vm.websocketUrl = protocol + '://' + $location.host() + ':' + $location.port() + '/pp/v1/' +
      $stateParams.guid + '/firehose';

    // Comment this out to test firehose stream in gulp dev (connect directly to the portal)
    vm.websocketUrl = protocol + '://' + $location.host() + ':3003/v1/' + $stateParams.guid + '/firehose';

    vm.autoScrollOn = true; // auto-scroll by default

    // After the user has scrolled up we disable auto-scroll
    // They can re-enable auto-scroll either by:
    // - manually scrolling to the bottom
    // - clicking the auto-scroll button
    vm.autoScroll = function () {
      vm.autoScrollOn = true;
    };

    vm.jsonFilter = jsonFilter;

    $document.on('keydown', keyHandler);
    $scope.$on('$destroy', function () {
      $document.off('keydown', keyHandler);
    });
    $scope.$watchCollection(function () {
      return vm.hoseFilters;
    }, function (newVal, oldVal) {
      if (newVal === oldVal) {
        return;
      }
      localStorage.setItem('firehose-filters', angular.toJson(vm.hoseFilters));
    });

    function buildOriginString(cfEvent, colour, bold) {
      return buildTimestampString(cfEvent) + ': ' +
        coloredLog('[' + cfEvent.deployment + '/' + cfEvent.origin + '/' + cfEvent.job + ']', colour, bold);
    }

    function buildTimestampString(cfEvent) {
      // CF timestamps are in nanoseconds
      var msStamp = Math.round(cfEvent.timestamp / 1000000);
      return moment(msStamp).format('HH:mm:ss.SSS');
    }

    function handleApiEvent(cfEvent) {
      if (!vm.hoseFilters.api) {
        return '';
      }
      var httpStartStop = cfEvent.httpStartStop;
      var method = HTTP_METHODS[httpStartStop.method - 1];
      var peerType = httpStartStop.peerType === 1 ? 'Client' : 'Server';
      var httpEventString = peerType + ' ' + coloredLog(method, 'magenta', true) + ' ' +
        coloredLog(httpStartStop.uri, null, true) +
        ', Status-Code: ' + coloredLog(httpStartStop.statusCode, 'green') +
        ', Content-Length: ' + coloredLog(utils.bytesToHumanSize(httpStartStop.contentLength), 'green') +
        ', User-Agent: ' + coloredLog(httpStartStop.userAgent, 'green') +
        ', Remote-Address: ' + coloredLog(httpStartStop.remoteAddress, 'green') + '\n';
      return buildOriginString(cfEvent, 'magenta') + ' ' + httpEventString;
    }

    function handleAppLog(cfEvent) {
      if (!vm.hoseFilters.apps) {
        return '';
      }
      var message = cfEvent.logMessage;
      var colour;
      if (message.message_type === 2) {
        colour = 'red';
      }
      var messageSource = coloredLog('[' + message.source_type + '.' + message.source_instance + ']', 'green', true);
      var messageString = coloredLog(base64.decode(message.message), colour, false) + '\n';
      return buildOriginString(cfEvent, 'green') + ' ' + messageSource + ' ' + messageString;
    }

    function emphasizeName(dottedString, colour) {
      var metricName = dottedString;
      var lastDot = metricName.lastIndexOf('.');
      if (lastDot > -1) {
        // Weird bug where sometimes the name ends with a dot
        if (lastDot === dottedString.length - 1) {
          return coloredLog(metricName.slice(0, -1), colour, true);
        }
        var prefix = metricName.slice(0, lastDot + 1);
        var name = metricName.slice(lastDot + 1);
        metricName = prefix + coloredLog(name, colour, true);
      } else {
        metricName = coloredLog(metricName, colour, true);
      }
      return metricName;
    }

    function handleMetricEvent(cfEvent) {
      if (!vm.hoseFilters.metrics) {
        return '';
      }
      var valueMetric = cfEvent.valueMetric;
      var valueMetricString = emphasizeName(valueMetric.name, 'blue') + ': ' +
        coloredLog(valueMetric.value + ' ' + valueMetric.unit, 'green', true) + '\n';
      return buildOriginString(cfEvent, 'blue') + ' ' + valueMetricString;
    }

    function handleCounterEvent(cfEvent) {
      if (!vm.hoseFilters.counters) {
        return '';
      }
      var counterEvent = cfEvent.counterEvent;
      var delta, total;
      if (counterEvent.name.indexOf('ByteCount') !== -1) {
        delta = utils.bytesToHumanSize(counterEvent.delta);
        total = utils.bytesToHumanSize(counterEvent.total);
      } else {
        delta = counterEvent.delta;
        total = counterEvent.total;
      }
      var counterEventString = emphasizeName(counterEvent.name, 'yellow') +
        ': delta = ' + coloredLog(delta, 'green', true) +
        ', total = ' + coloredLog(total, 'green', true) + '\n';
      return buildOriginString(cfEvent, 'yellow') + ' ' + counterEventString;
    }

    function handleContainerMetricsEvent(cfEvent) {
      if (!vm.hoseFilters.containerMetrics) {
        return '';
      }
      var containerMetric = cfEvent.containerMetric;
      var metricString = 'App: ' + containerMetric.applicationId + '/' + containerMetric.instanceIndex +
        ' ' + coloredLog('[', 'cyan', true) + coloredLog('CPU: ', 'cyan', true) +
        coloredLog(Math.round(containerMetric.cpuPercentage * 100) + '%', 'green', true) +
        ', ' + coloredLog('Memory: ', 'cyan', true) +
        coloredLog(utils.bytesToHumanSize(containerMetric.memoryBytes), 'green', true) +
        ', ' + coloredLog('Disk: ', 'cyan', true) +
        coloredLog(utils.bytesToHumanSize(containerMetric.diskBytes), 'green', true) + coloredLog(']', 'cyan', true);
      return buildOriginString(cfEvent, 'cyan') + ' ' + metricString + '\n';
    }

    function handleErrorEvent(cfEvent) {
      if (!vm.hoseFilters.errors) {
        return '';
      }
      var errorObj = cfEvent.error;
      var errorString = 'ERROR: Source: ' + coloredLog(errorObj.source, 'red', true) +
        ', Code: ' + coloredLog(errorObj.code, 'red', true) +
        ', Message: ' + coloredLog(errorObj.message, 'red', true);
      return buildOriginString(cfEvent, 'red', true) + ' ' + errorString + '\n';
    }

    function handleOtherEvent(jsonString) {
      if (!vm.hoseFilters.others) {
        return '';
      }
      return jsonString;
    }

    // Map each character index in the sanitized version of originalString to its original index in originalString
    function mapSanitizedIndices(originalString) {
      var escapeMatch;
      var mappedIndices = {};
      var mappedUpTo = 0;
      var offset = 0;

      ANSI_ESCAPE_MATCHER.lastIndex = 0;
      while ((escapeMatch = ANSI_ESCAPE_MATCHER.exec(originalString)) !== null) {
        while (mappedUpTo + offset < escapeMatch.index) {
          mappedIndices[mappedUpTo] = offset + mappedUpTo++;
        }
        offset += escapeMatch[0].length;
      }
      while (mappedUpTo + offset < originalString.length) {
        mappedIndices[mappedUpTo] = offset + mappedUpTo++;
      }
      return mappedIndices;
    }

    function jsonFilter(jsonString) {
      var filtered = jsonString;
      try {
        var cfEvent = angular.fromJson(jsonString);
        switch (cfEvent.eventType) {
          case 4:
            filtered = handleApiEvent(cfEvent);
            break;
          case 5:
            filtered = handleAppLog(cfEvent);
            break;
          case 6:
            filtered = handleMetricEvent(cfEvent);
            break;
          case 7:
            filtered = handleCounterEvent(cfEvent);
            break;
          case 8:
            filtered = handleErrorEvent(cfEvent);
            break;
          case 9:
            filtered = handleContainerMetricsEvent(cfEvent);
            break;
          default:
            filtered = handleOtherEvent(cfEvent);
        }
      } catch (error) {
        $log.error('Failed to filter jsonMessage from WebSocket: ', jsonString);
        filtered = jsonString;
      }

      if (vm.textFilter.toMatch) {
        var matchIndex, toMatch, compareTo, escapeMatch;

        var sanitized = filtered.replace(ANSI_ESCAPE_MATCHER, '');

        if (vm.textFilter.matchCase) {
          toMatch = vm.textFilter.toMatch;
          compareTo = sanitized;
        } else {
          toMatch = vm.textFilter.toMatch.toLowerCase();
          compareTo = sanitized.toLowerCase();
        }
        matchIndex = compareTo.indexOf(toMatch);
        if (matchIndex < 0) {
          return '';
        }

        if (!vm.textFilter.highlightMatches) {
          // It's a match and we are not highlighting, just return filtered as-is
          return filtered;
        }

        // It's a match and we are highlighting, need to find and highlight *all* matches

        // Map each character in sanitized to indices in filtered
        var mappedIndices = mapSanitizedIndices(filtered);

        // console.log('Filtered: ' + filtered);
        // console.log('Sanitized: ' + sanitized);
        // console.log('Mapped indices: ', JSON.stringify(mappedIndices, null, 4));

        var finalString = '';
        var leftToParse = filtered;

        var matchLength = vm.textFilter.toMatch.length;
        var afterLastMatch = 0;

        while (matchIndex >= 0) {
          var before = leftToParse.slice(0, mappedIndices[matchIndex] - afterLastMatch);
          var allBefore = filtered.slice(0, mappedIndices[matchIndex]);
          var matched = filtered.slice(mappedIndices[matchIndex], mappedIndices[matchIndex + matchLength]);
          var toEndOfMatch = allBefore + matched;

          var sanitizedMatch = sanitized.slice(matchIndex, matchIndex + matchLength);

          // Remember the previous foreground colour and bold (we know we don't use background colours)
          var boldOn = null;
          var prevColour = null;
          var lastColourMatches = null;
          ANSI_ESCAPE_MATCHER.lastIndex = 0;
          while ((escapeMatch = ANSI_ESCAPE_MATCHER.exec(toEndOfMatch)) !== null) {
            lastColourMatches = escapeMatch;
          }
          if (lastColourMatches !== null) {
            boldOn = lastColourMatches[1].indexOf('1') === 0;
            if (lastColourMatches[1] === '1') {
              prevColour = null;
            } else {
              if (boldOn) {
                prevColour = lastColourMatches[1][3];
              } else {
                prevColour = lastColourMatches[1][1];
              }
            }
          }
          finalString += before + utils.highlightLog(sanitizedMatch, prevColour, boldOn);

          leftToParse = leftToParse.slice(mappedIndices[matchIndex + matchLength] - afterLastMatch);
          afterLastMatch = mappedIndices[matchIndex + matchLength];

          matchIndex = sanitized.toLowerCase().indexOf(toMatch, matchIndex + matchLength);
        }

        return finalString + leftToParse;
      }
      return filtered;
    }

  }

})();
