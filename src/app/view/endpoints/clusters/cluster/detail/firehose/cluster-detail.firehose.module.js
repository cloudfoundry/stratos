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
      controllerAs: 'clusterFirehoseController',
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
    '$timeout'
  ];

  function ClusterFirehoseController(base64, modelManager, utils, $scope, $stateParams, $location, $log, $timeout) {
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

    $scope.$watchCollection(function () {
      return that.show;
    }, function (newVal, oldVal) {
      if (newVal === oldVal) {
        return;
      }
      var url = that.websocketUrl;
      that.websocketUrl = undefined;
      $timeout(function () {
        that.websocketUrl = url;
      });

    });

    var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
    this.websocketUrl = protocol + '://' + $location.host() + ':' + $location.port() + '/pp/v1/' +
      $stateParams.guid + '/apps/' + $stateParams.guid + '/stream';

    // Comment this out to test log stream in gulp dev
    // this.websocketUrl = 'wss://localhost:3003/v1/' + $stateParams.guid + '/apps/' + $stateParams.guid + '/stream';

    // Comment this out to test firehose stream in gulp dev
    this.websocketUrl = 'wss://localhost:3003/v1/' + $stateParams.guid + '/firehose';

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

    this.jsonFilter = function (jsonString) {
      try {
        var eventObj = angular.fromJson(jsonString);

        // CF timestamps are in nanoseconds
        var msStamp = Math.round(eventObj.timestamp / 1000000);
        var timeStamp = coloredLog(moment(msStamp).format('YYYY-MM-DD HH:mm:ss'), 'blue');

        var origin;
        switch (eventObj.eventType) {
          case 4:
            if (!that.show.api) {
              return '';
            }
            var httpStartStop = eventObj.httpStartStop;
            origin = coloredLog('[' + eventObj.origin + '/' + eventObj.deployment + '/' + eventObj.job + '.' + eventObj.index + ']', 'magenta');
            var method = httpMethods[httpStartStop.method];
            var peerType = httpStartStop.peerType === 1 ? 'Client' : 'Server';
            var httpEventString = peerType + ' ' + method + ' -> ' + httpStartStop.uri +
              ', status: ' + httpStartStop.statusCode +
              ', content length: ' + httpStartStop.contentLength +
              ', agent: ' + httpStartStop.userAgent + '\n';
            return origin + ' ' + timeStamp + ': ' + httpEventString;
          case 5:
            if (!that.show.apps) {
              return '';
            }
            var message = eventObj.logMessage;
            var messageString = base64.decode(message.message) + '\n';
            var messageSource = coloredLog('[' + message.source_type + '.' + message.source_instance + ']', 'green');
            return messageSource + ' ' + timeStamp + ': ' + messageString;
          case 6:
            if (!that.show.metrics) {
              return '';
            }
            var valueMetric = eventObj.valueMetric;
            origin = coloredLog('[' + eventObj.origin + '/' + eventObj.deployment + ']', 'yellow');
            var valueMetricString = valueMetric.name + ': ' + valueMetric.value + ' ' + valueMetric.unit + '\n';
            return origin + ' ' + timeStamp + ': ' + valueMetricString;
          case 7:
            if (!that.show.counters) {
              return '';
            }
            var counterEvent = eventObj.counterEvent;
            origin = coloredLog('[' + eventObj.origin + '/' + eventObj.deployment + '/' + eventObj.job + ']', 'yellow');
            var counterEventString = counterEvent.name + ': delta = ' + counterEvent.delta + ', total = ' + counterEvent.total + '\n';
            return origin + ' ' + timeStamp + ': ' + counterEventString;
          case 8:
            if (!that.show.errors) {
              return '';
            }
            origin = coloredLog('[' + eventObj.origin + '/' + eventObj.deployment + '/' + eventObj.job + ']', 'red');
            var errorString = '';
            return origin + ' ' + timeStamp + ': ' + errorString + '\n';
          case 9:
            if (!that.show.containerMetrics) {
              return '';
            }
            origin = coloredLog('[' + eventObj.origin + '/' + eventObj.deployment + '/' + eventObj.job + ']', 'cyan');
            var containerMetric = eventObj.containerMetric;
            var metricString = 'App: ' + containerMetric.applicationId + '/' + containerMetric.instanceIndex +
              ', CPU: ' + Math.round(containerMetric.cpuPercentage * 100) + '%' +
              ', Memory: ' + utils.bytesToHumanSize(containerMetric.memoryBytes) +
              ', Disk: ' + utils.bytesToHumanSize(containerMetric.diskBytes);
            return origin + ' ' + timeStamp + ': ' + metricString + '\n';
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

    var colorCodes = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
    function coloredLog(message, color, background) {
      var colorCode = color ? colorCodes.indexOf(color) : false;
      var backgroundCode = background ? colorCodes.indexOf(background) : false;
      var ret = '';
      if (color) {
        ret += '\x1B[3' + colorCode + 'm';
      }
      if (background) {
        ret += '\x1B[4' + backgroundCode + 'm';
      }
      ret += message;
      if (color || background) {
        ret += '\x1B[0m';
      }
      return ret;
    }
  }

})();
