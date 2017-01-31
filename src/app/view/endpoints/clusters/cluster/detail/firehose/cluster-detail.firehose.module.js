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
    'app.model.modelManager',
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

  function ClusterFirehoseController(base64, modelManager, utils, localStorage,
                                     $scope, $stateParams, $location, $log, $document, $timeout, $animate) {
    var vm = this;

    this.model = modelManager.retrieve('cloud-foundry.model.application');

    var defaultFilters = {
      api: true,
      apps: true,
      metrics: true,
      counters: true,
      errors: true,
      containerMetrics: true,
      others: true
    };

    try {
      this.hoseFilters = angular.fromJson(localStorage.getItem('firehose-filters', defaultFilters));
    } catch (error) {
      this.hoseFilters = defaultFilters;
    }

    var theElement = angular.element('#firehose-container')[0];
    $animate.enabled(false, theElement);

    $scope.$watchCollection(function () {
      return vm.hoseFilters;
    }, function (newVal, oldVal) {
      if (newVal === oldVal) {
        return;
      }
      localStorage.setItem('firehose-filters', angular.toJson(vm.hoseFilters));
    });

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

    $document.on('keydown', keyHandler);
    $scope.$on('$destroy', function () {
      $document.off('keydown', keyHandler);
    });

    var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
    this.websocketUrl = protocol + '://' + $location.host() + ':' + $location.port() + '/pp/v1/' +
      $stateParams.guid + '/firehose';

    // Comment this out to test firehose stream in gulp dev
    // this.websocketUrl = 'wss://localhost:3003/v1/' + $stateParams.guid + '/firehose';
    this.websocketUrl = 'wss://julien.labs.hpecorp.net:3003/v1/' + $stateParams.guid + '/firehose';

    this.autoScrollOn = true; // auto-scroll by default

    // After the user has scrolled up we disable auto-scroll
    // They can re-enable auto-scroll either by:
    // - manually scrolling to the bottom
    // - clicking the auto-scroll button
    this.autoScroll = function () {
      this.autoScrollOn = true;
    };

    var httpMethods = [
      'GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'ACL', 'BASELINE_CONTROL', 'BIND', 'CHECKIN', 'CHECKOUT', 'CONNECT',
      'COPY', 'DEBUG', 'LABEL', 'LINK', 'LOCK', 'MERGE', 'MKACTIVITY', 'MKCALENDAR', 'MKCOL', 'MKREDIRECTREF',
      'MKWORKSPACE', 'MOVE', 'OPTIONS', 'ORDERPATCH', 'PATCH', 'PRI', 'PROPFIND', 'PROPPATCH', 'REBIND', 'REPORT',
      'SEARCH', 'SHOWMETHOD', 'SPACEJUMP', 'TEXTSEARCH', 'TRACE', 'TRACK', 'UNBIND', 'UNCHECKOUT', 'UNLINK', 'UNLOCK',
      'UPDATE', 'UPDATEREDIRECTREF', 'VERSION_CONTROL'
    ];

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
      var method = httpMethods[httpStartStop.method];
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
      var messageString = coloredLog(base64.decode(message.message), null, true) + '\n';
      var messageSource = coloredLog('[' + message.source_type + '.' + message.source_instance + ']', 'green', true);
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
      var counterEventString = emphasizeName(counterEvent.name, 'yellow') +
        ': delta = ' + coloredLog(counterEvent.delta, 'green', true) +
        ', total = ' + coloredLog(counterEvent.total, 'green', true) + '\n';
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
      var errorString = 'ERROR: ';
      if (angular.isDefined(errorObj.source)) {
        errorString += 'Source: ' + coloredLog(errorObj.source, 'red', true) + ', ';
      }
      if (angular.isDefined(errorObj.code)) {
        errorString += 'Code: ' + coloredLog(errorObj.code, 'red', true) + ', ';
      }
      if (angular.isDefined(errorObj.message)) {
        errorString += 'Message: ' + coloredLog(errorObj.message, 'red', true);
      }
      return buildOriginString(cfEvent, 'red', true) + ' ' + errorString + '\n';
    }

    function handleOtherEvent(jsonString) {
      if (!vm.hoseFilters.others) {
        return '';
      }
      return jsonString;
    }

    var RESET = '\x1B[0m';
    /* eslint-disable no-control-regex */
    var lastColourMatcher = new RegExp('\x1B\\[([0-9;]*)m', 'g');
    /* eslint-enable no-control-regex */

    this.jsonFilter = function (jsonString) {
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
      if (vm.textFilter) {
        if (vm.textFilterRegex) {
          if (!filtered.match(new RegExp(vm.textFilter))) {
            return '';
          }
        } else {
          var matchIndex;
          if (vm.textFilterCaseSensitive) {
            matchIndex = filtered.indexOf(vm.textFilter);
          } else {
            matchIndex = filtered.toLowerCase().indexOf(vm.textFilter.toLowerCase());
          }
          if (matchIndex < 0) {
            return '';
          }
          var finalString = '';
          var leftToParse = filtered;
          var trueMatch = false;
          while (matchIndex >= 0) {
            var before = leftToParse.slice(0, matchIndex);
            var allBefore = finalString + before;
            var matched = leftToParse.slice(matchIndex, matchIndex + vm.textFilter.length);
            leftToParse = leftToParse.slice(matchIndex + vm.textFilter.length);

            var lastEscape = allBefore.lastIndexOf('\x1B');
            if (lastEscape > -1) {
              var escaped = allBefore.slice(lastEscape);
              var mIndex = escaped.indexOf('m');
              if (mIndex < 0) {
                finalString = allBefore + matched;
                matchIndex = leftToParse.toLowerCase().indexOf(vm.textFilter.toLowerCase());
                continue;
              }
            }

            trueMatch = true;

            // Remember the previous foreground colour and bold (we know we don't use background colours)
            var lastReset = allBefore.lastIndexOf(RESET);
            if (lastReset < 0) {
              lastReset = 0;
            } else {
              lastReset += RESET.length;
            }
            var afterReset = allBefore.slice(lastReset);

            lastColourMatcher.lastIndex = 0;
            var matches = lastColourMatcher.exec(afterReset);

            var boldOn, prevColour;
            if (matches !== null) {
              boldOn = matches[1].indexOf('1') === 0;
              if (matches[1] === '1') {
                prevColour = null;
              } else {
                if (boldOn) {
                  prevColour = matches[1][3];
                } else {
                  prevColour = matches[1][1];
                }
              }
            }
            finalString = allBefore + highlightLog(matched, prevColour, boldOn);
            matchIndex = leftToParse.toLowerCase().indexOf(vm.textFilter.toLowerCase());
          }

          if (!trueMatch) {
            return '';
          }
          return finalString + leftToParse;
        }
      }
      return filtered;
    };

    var colorCodes = {
      black: 0,
      red: 1,
      green: 2,
      yellow: 3,
      blue: 4,
      magenta: 5,
      cyan: 6,
      white: 7
    };

    function coloredLog(message, color, boldOn) {
      if (boldOn) {
        if (color) {
          return '\x1B[1;3' + colorCodes[color] + 'm' + message + RESET;
        }
        return '\x1B[1m' + message + RESET;
      }
      return '\x1B[3' + colorCodes[color] + 'm' + message + RESET;
    }

    function highlightLog(message, previousColour, wasBoldOn) {
      var ret = '\x1B[0;4' + colorCodes.yellow + ';30m' + message + RESET;
      if (previousColour) {
        ret += '\x1B[3' + previousColour + 'm';
      }
      if (wasBoldOn) {
        ret += '\x1B[1m';
      }
      console.log('Returning ret ' + ret);
      return ret;
    }

  }

})();
