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
    '$scope',
    '$stateParams',
    '$location',
    '$log',
    '$timeout',
    '$document'
  ];

  function ClusterFirehoseController(base64, modelManager, utils, $scope, $stateParams, $location, $log, $timeout, $document) {
    var that = this;

    this.model = modelManager.retrieve('cloud-foundry.model.application');

    this.show = {
      api: true,
      apps: true,
      metrics: true,
      counters: true,
      errors: true,
      containerMetrics: true,
      others: true
    };

    this.onFilterChanged = function (onOff) {
      if (!onOff) {
        var url = that.websocketUrl;
        that.websocketUrl = undefined;
        $timeout(function () {
          that.websocketUrl = url;
        });
      }
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
      $stateParams.guid + '/apps/' + $stateParams.guid + '/stream';

    // Comment this out to test firehose stream in gulp dev
    // this.websocketUrl = 'wss://localhost:3003/v1/' + $stateParams.guid + '/firehose';

    this.autoScrollOn = true; // auto-scroll by default

    // After the user has scrolled up we disable auto-scroll
    // They can re-enable auto-scroll either by:
    // - manually scrolling to the bottom
    // - clicking the auto-scroll button
    this.autoScroll = function () {
      this.autoScrollOn = true;
    };

    var httpMethods = [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'HEAD',
      'ACL',
      'BASELINE_CONTROL',
      'BIND',
      'CHECKIN',
      'CHECKOUT',
      'CONNECT',
      'COPY',
      'DEBUG',
      'LABEL',
      'LINK',
      'LOCK',
      'MERGE',
      'MKACTIVITY',
      'MKCALENDAR',
      'MKCOL',
      'MKREDIRECTREF',
      'MKWORKSPACE',
      'MOVE',
      'OPTIONS',
      'ORDERPATCH',
      'PATCH',
      'PRI',
      'PROPFIND',
      'PROPPATCH',
      'REBIND',
      'REPORT',
      'SEARCH',
      'SHOWMETHOD',
      'SPACEJUMP',
      'TEXTSEARCH',
      'TRACE',
      'TRACK',
      'UNBIND',
      'UNCHECKOUT',
      'UNLINK',
      'UNLOCK',
      'UPDATE',
      'UPDATEREDIRECTREF',
      'VERSION_CONTROL'
    ];

    function processTimeStamp(eventObj) {
      // CF timestamps are in nanoseconds
      var msStamp = Math.round(eventObj.timestamp / 1000000);
      return coloredLog(moment(msStamp).format('YYYY-MM-DD HH:mm:ss'), 'blue');
    }

    function buildOriginString(eventObj) {
      return '[' + eventObj.origin + '/' + eventObj.deployment + '/' + eventObj.job + '.' + eventObj.index + ']';
    }

    function handleApiEvent(eventObj) {
      var httpStartStop = eventObj.httpStartStop;
      var method = httpMethods[httpStartStop.method];
      var peerType = httpStartStop.peerType === 1 ? 'Client' : 'Server';
      var httpEventString = peerType + ' ' + method + ' -> ' + httpStartStop.uri +
        ', status: ' + coloredLog(httpStartStop.statusCode, 'green') +
        ', content length: ' + httpStartStop.contentLength +
        ', agent: ' + httpStartStop.userAgent + '\n';
      return processTimeStamp(eventObj) + ' ' + coloredLog(buildOriginString(eventObj), 'magenta') + ' ' + httpEventString;
    }

    this.jsonFilter = function (jsonString) {
      try {
        var eventObj = angular.fromJson(jsonString);

        switch (eventObj.eventType) {
          case 4:
            if (!that.show.api) {
              return '';
            }
            return handleApiEvent(eventObj);
          case 5:
            if (!that.show.apps) {
              return '';
            }
            // CF timestamps are in nanoseconds
            var msStamp = Math.round(eventObj.timestamp / 1000000);
            var timeStamp = coloredLog(moment(msStamp).format('YYYY-MM-DD HH:mm:ss'), 'blue');
            var originString = '[' + eventObj.origin + '/' + eventObj.deployment + '/' + eventObj.job + '.' + eventObj.index + ']';
            var message = eventObj.logMessage;
            var messageString = base64.decode(message.message) + '\n';
            var messageSource = coloredLog('[' + message.source_type + '.' + message.source_instance + ']', 'red');
            return timeStamp + ' ' + coloredLog(originString, 'green') + ' ' + messageSource + ' ' + messageString;
          case 6:
            if (!that.show.metrics) {
              return '';
            }
            // CF timestamps are in nanoseconds
            var msStamp = Math.round(eventObj.timestamp / 1000000);
            var timeStamp = coloredLog(moment(msStamp).format('YYYY-MM-DD HH:mm:ss'), 'blue');
            var originString = '[' + eventObj.origin + '/' + eventObj.deployment + '/' + eventObj.job + '.' + eventObj.index + ']';
            var valueMetric = eventObj.valueMetric;
            var valueMetricString = valueMetric.name + ': ' + coloredLog(valueMetric.value + ' ' + valueMetric.unit, 'green') + '\n';
            return timeStamp + ' ' + coloredLog(originString, 'yellow') + ' ' + valueMetricString;
          case 7:
            if (!that.show.counters) {
              return '';
            }
            // CF timestamps are in nanoseconds
            var msStamp = Math.round(eventObj.timestamp / 1000000);
            var timeStamp = coloredLog(moment(msStamp).format('YYYY-MM-DD HH:mm:ss'), 'blue');
            var originString = '[' + eventObj.origin + '/' + eventObj.deployment + '/' + eventObj.job + '.' + eventObj.index + ']';
            var counterEvent = eventObj.counterEvent;
            var counterEventString = counterEvent.name + ': delta = ' + coloredLog(counterEvent.delta, 'green') +
              ', total = ' + coloredLog(counterEvent.total, 'green') + '\n';
            return timeStamp + ' ' + coloredLog(originString, 'yellow') + ' ' + counterEventString;
          case 8:
            if (!that.show.errors) {
              return '';
            }
            // CF timestamps are in nanoseconds
            var msStamp = Math.round(eventObj.timestamp / 1000000);
            var timeStamp = coloredLog(moment(msStamp).format('YYYY-MM-DD HH:mm:ss'), 'blue');
            var originString = '[' + eventObj.origin + '/' + eventObj.deployment + '/' + eventObj.job + '.' + eventObj.index + ']';
            var errorString = '';
            return timeStamp + ' ' + coloredLog(originString, 'red') + ' ' + errorString + '\n';
          case 9:
            if (!that.show.containerMetrics) {
              return '';
            }
            // CF timestamps are in nanoseconds
            var msStamp = Math.round(eventObj.timestamp / 1000000);
            var timeStamp = coloredLog(moment(msStamp).format('YYYY-MM-DD HH:mm:ss'), 'blue');
            var originString = '[' + eventObj.origin + '/' + eventObj.deployment + '/' + eventObj.job + '.' + eventObj.index + ']';
            var containerMetric = eventObj.containerMetric;
            var metricString = 'App: ' + containerMetric.applicationId + '/' + containerMetric.instanceIndex +
              ', CPU: ' + coloredLog(Math.round(containerMetric.cpuPercentage * 100) + '%', 'green') +
              ', Memory: ' + coloredLog(utils.bytesToHumanSize(containerMetric.memoryBytes), 'green') +
              ', Disk: ' + coloredLog(utils.bytesToHumanSize(containerMetric.diskBytes), 'green');
            return timeStamp + ' ' + coloredLog(originString, 'cyan') + ' ' + metricString + '\n';
          default:
            if (!that.show.others) {
              return '';
            }
            return jsonString;
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

    function coloredLog(message, color) {
      return '\x1B[3' + colorCodes[color] + 'm' + message + '\x1B[0m';
    }
  }

})();
