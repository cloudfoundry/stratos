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
    '$timeout',
    '$document'
  ];

  function ClusterFirehoseController(base64, modelManager, utils, localStorage, $scope, $stateParams, $location, $log, $timeout, $document) {
    var that = this;

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

    this.onFilterChanged = function () {
      localStorage.setItem('firehose-filters', angular.toJson(this.hoseFilters));
    };

    var handlerUnbind = $document.on('keydown', function (e) {
      if (e.keyCode === 27 && that.fullScreen) {
        e.stopPropagation();
        e.preventDefault();
        $scope.$apply(function () {
          that.fullScreen = false;
        });
        return true;
      }
    });
    $scope.$on('$destroy', function () {
      handlerUnbind();
    });

    var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
    this.websocketUrl = protocol + '://' + $location.host() + ':' + $location.port() + '/pp/v1/' +
      $stateParams.guid + '/firehose';

    // Comment this out to test firehose stream in gulp dev
    this.websocketUrl = 'wss://localhost:3003/v1/' + $stateParams.guid + '/firehose';
    // this.websocketUrl = 'wss://julien.labs.hpecorp.net:3003/v1/' + $stateParams.guid + '/firehose';

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

    function buildOriginString(cfEvent, colour) {
      return buildTimestampString(cfEvent) + ': ' +
        coloredLog('[' + cfEvent.deployment + '/' + cfEvent.origin + '/' + cfEvent.job + ']', colour);
    }

    function buildTimestampString(cfEvent) {
      // CF timestamps are in nanoseconds
      var msStamp = Math.round(cfEvent.timestamp / 1000000);
      return moment(msStamp).format('HH:mm:ss.SSS');
    }

    function handleApiEvent(cfEvent) {
      if (!that.hoseFilters.api) {
        return '';
      }
      var httpStartStop = cfEvent.httpStartStop;
      var method = httpMethods[httpStartStop.method];
      var peerType = httpStartStop.peerType === 1 ? 'Client' : 'Server';
      var httpEventString = peerType + ' ' + coloredLog(method, 'green', true) + ' ' +
        coloredLog(httpStartStop.uri, null, true) +
        ', Status-Code: ' + coloredLog(httpStartStop.statusCode, 'green') +
        ', Content-Length: ' + coloredLog(utils.bytesToHumanSize(httpStartStop.contentLength), 'green') +
        ', User-Agent: ' + httpStartStop.userAgent +
        ', Remote-Address: ' + httpStartStop.remoteAddress + '\n';
      return buildOriginString(cfEvent, 'magenta') + ' ' + httpEventString;
    }

    function handleAppLog(cfEvent) {
      if (!that.hoseFilters.apps) {
        return '';
      }
      var message = cfEvent.logMessage;
      var messageString = coloredLog(base64.decode(message.message), null, true) + '\n';
      var messageSource = coloredLog('[' + message.source_type + '.' + message.source_instance + ']', 'green', true);
      return buildOriginString(cfEvent, 'green') + ' ' + messageSource + ' ' + messageString;
    }

    function handleMetricEvent(cfEvent) {
      if (!that.hoseFilters.metrics) {
        return '';
      }
      var valueMetric = cfEvent.valueMetric;
      var valueMetricString = valueMetric.name + ': ' + coloredLog(valueMetric.value + ' ' + valueMetric.unit, 'green', true) + '\n';
      return buildOriginString(cfEvent, 'blue') + ' ' + valueMetricString;
    }

    function handleCounterEvent(cfEvent) {
      if (!that.hoseFilters.counters) {
        return '';
      }
      var counterEvent = cfEvent.counterEvent;
      var counterEventString = counterEvent.name + ': delta = ' + coloredLog(counterEvent.delta, 'green', true) +
        ', total = ' + coloredLog(counterEvent.total, 'green', true) + '\n';
      return buildOriginString(cfEvent, 'yellow') + ' ' + counterEventString;
    }

    function handleContainerMetricsEvent(cfEvent) {
      if (!that.hoseFilters.containerMetrics) {
        return '';
      }
      var containerMetric = cfEvent.containerMetric;
      var metricString = 'App: ' + containerMetric.applicationId + '/' + containerMetric.instanceIndex +
        ' - ' + coloredLog('CPU: ', null, true) + coloredLog(Math.round(containerMetric.cpuPercentage * 100) + '%', 'green', true) +
        ', ' + coloredLog('Memory: ', null, true) + coloredLog(utils.bytesToHumanSize(containerMetric.memoryBytes), 'green', true) +
        ', ' + coloredLog('Disk: ', null, true) + coloredLog(utils.bytesToHumanSize(containerMetric.diskBytes), 'green', true);
      return buildOriginString(cfEvent, 'cyan') + ' ' + metricString + '\n';
    }

    function handleErrorEvent(cfEvent) {
      if (!that.hoseFilters.errors) {
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
      if (!that.hoseFilters.others) {
        return '';
      }
      return jsonString;
    }

    this.jsonFilter = function (jsonString) {
      try {
        var cfEvent = angular.fromJson(jsonString);
        switch (cfEvent.eventType) {
          case 4:
            return handleApiEvent(cfEvent);
          case 5:
            return handleAppLog(cfEvent);
          case 6:
            return handleMetricEvent(cfEvent);
          case 7:
            return handleCounterEvent(cfEvent);
          case 8:
            return handleErrorEvent(cfEvent);
          case 9:
            return handleContainerMetricsEvent(cfEvent);
          default:
            return handleOtherEvent(cfEvent);
        }
      } catch (error) {
        $log.error('Failed to filter jsonMessage from WebSocket: ', jsonString);
        return jsonString;
      }
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
          return '\x1B[1;3' + colorCodes[color] + 'm' + message + '\x1B[0m';
        }
        return '\x1B[1m' + message + '\x1B[0m';
      }
      return '\x1B[3' + colorCodes[color] + 'm' + message + '\x1B[0m';
    }
  }

})();
