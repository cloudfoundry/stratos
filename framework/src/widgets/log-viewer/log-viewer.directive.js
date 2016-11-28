(function () {

  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('logViewer', logViewer);

  logViewer.$inject = [
    'AnsiColorsService',
    '$websocket',
    '$log'
  ];

  /**
   * @name logViewer
   * @memberOf helion.framework.widgets
   * @namespace helion.framework.widgets.logViewer
   * @description  Display logs, in color
   * @params {object} AnsiColorsService - color service
   * @params {object} $websocket - $websocket service
   * @params {object} $log - Angular $log
   * @constructor
   * Note: the streaming log part is not fully enabled yet since we can't write a service for it until TEAMFOUR-353
   */

  function logViewer(AnsiColorsService, $websocket, $log) {

    // logContainer, logTextArea: Access elements directly for better performance with large and fast logs
    // handleScroll, handleWheel: Scroll handler defined in controller needs to be attached by link
    var logContainer, logTextArea, handleScroll, handleWheel;

    // Minimize browser reflow cost by saving old log chunks into
    // static divs and only append to a small 'active' div
    var logDivCapacity = 8 * 1024;

    // Batch up removes from DOM to save reflow costs
    var truncateDelayMs = 1000;

    // Batch up appends to DOM to save reflow costs
    var batchDelayMs = 33;

    var STREAMING_STATUS = {
      NOT_STREAMING: 0,
      ONLINE: 1,
      CONNECTING: 2,
      CLOSED: 3
    };

    function logViewerLink(scope, logContainerJq) {
      logContainer = logContainerJq[0];
      logContainerJq.on('scroll', handleScroll);
      logContainerJq.on('mousewheel', handleWheel);
    }

    LogViewerController.$inject = ['$scope'];

    function LogViewerController($scope) {
      var logViewer = this;

      var colorizer = AnsiColorsService.getInstance();

      var logDivId = 0;
      var oldestLogDiv = 0;

      // Keep track of the number of bytes held in the viewer
      var totalSize = 0;

      // Prevent wrongly toggling autoScrollOn after non-user scroll events
      var automaticScrolled = false;

      handleScroll = scrollHandler;
      handleWheel = wheelHandler;

      function makeLogDiv() {
        angular.element(logContainer).append('<div id="logDiv-' + ++logDivId + '" style="width: 100%;"></div>');
        logTextArea = angular.element('#logDiv-' + logDivId)[0];
        logViewer.currentLog = '';
      }

      function realTruncateOldDivs() {
        if (!logViewer.maxSize) {
          return;
        }

        // Remember scrollTop and scrollHeight before truncation
        var oldScrollTop = logContainer.scrollTop;
        var preHeight = logContainer.scrollHeight;

        // Truncate to reclaim 2 divs worth of spare capacity
        while (totalSize > logViewer.maxSize - 2 * logDivCapacity) {

          // Keep at least 2 divs to avoid blanking the log
          if (oldestLogDiv >= logDivId - 2) {
            break;
          }

          var oldDiv = angular.element('#logDiv-' + ++oldestLogDiv);
          if (oldDiv.length < 1) {
            // Shouldn't happen
            oldestLogDiv--;
            break;
          }
          totalSize -= oldDiv[0].innerHTML.length;
          oldDiv.remove();
        }

        // If not auto-scrolling, maintain the visible portion of the log
        if (!logViewer.autoScrollOn && oldScrollTop > 0) {
          var delta = preHeight - logContainer.scrollHeight;
          var newScrollTop = oldScrollTop - delta;
          if (newScrollTop < 0) {
            newScrollTop = 0;
          }
          setScrollTop(newScrollTop);
        }

        // Truncating the log can create an automatic scroll event, skip this in our scroll handler
        automaticScrolled = true;
      }

      // This debounce is crucial to mitigate truncation cost on very fast logs
      var truncateOldDivs = _.debounce(realTruncateOldDivs, truncateDelayMs, {
        leading: false,
        trailing: true,
        maxWait: truncateDelayMs
      });

      function updateAutoScroll() {
        // We need to allow 1px for flex layout pixel rounding
        logViewer.autoScrollOn = logContainer.scrollTop + 1 >= logContainer.scrollHeight - logContainer.clientHeight;
      }

      // Detect user (manual) scroll
      function scrollHandler() {
        if (automaticScrolled) {
          // Save on reflow cycles if scroll was automatic
          automaticScrolled = false;
        } else {
          // User scroll, update auto scroll
          $scope.$apply(function () {
            updateAutoScroll();
          });
        }
        return false;
      }

      // Trap wheel events in the log-viewer (only used in Webkit)
      function wheelHandler(event) {
        var delta = event.originalEvent.wheelDelta; // Ok as only needed in Chrome
        if (delta > 0 && logContainer.scrollTop === 0) {
          event.preventDefault();
        } else if (delta < 0 && logContainer.scrollTop + 1 >= logContainer.scrollHeight - logContainer.clientHeight) {
          event.preventDefault();
        }
      }

      function setScrollTop(newScrollTop) {
        if (logContainer.scrollTop !== newScrollTop) {
          automaticScrolled = true;
          logContainer.scrollTop = newScrollTop;
        }
      }

      function autoScroll() {
        if (logViewer.autoScrollOn) {
          setScrollTop(logContainer.scrollHeight - logContainer.clientHeight);
        }
      }

      // When the current log div is full, append a new one
      function rollNextLogDiv() {
        var currentDivSize = logTextArea.innerHTML.length;
        if (currentDivSize > logDivCapacity) {
          totalSize += currentDivSize;
          makeLogDiv();
        }
      }

      function realAppend() {
        logTextArea.innerHTML = logViewer.currentLog;
        rollNextLogDiv();
        autoScroll();
        if (logViewer.maxSize && totalSize > logViewer.maxSize) {
          truncateOldDivs();
        }
      }

      // This debounce is crucial to improving performance on very fast streaming logs
      var appendLog = _.debounce(realAppend, batchDelayMs, {
        leading: false,
        trailing: true,
        maxWait: batchDelayMs
      });

      function resetLog() {
        angular.element(logContainer).empty();
        logDivId = 0;
        oldestLogDiv = 0;
        totalSize = 0;
        automaticScrolled = false;
        makeLogDiv();
      }

      // Handle static logs
      function setStaticLogText() {
        resetLog();
        var logData = logViewer.logText;
        if (_.isUndefined(logData)) {
          return;
        }
        logViewer.streaming = STREAMING_STATUS.NOT_STREAMING;
        if (angular.isFunction(logViewer.filter)) {
          logData = logViewer.filter(logData);
        }
        var htmlMessage;
        if (logViewer.colorize) {
          htmlMessage = colorizer.ansiColorsToHtml(logData);
        } else {
          htmlMessage = logData;
        }
        logViewer.currentLog = htmlMessage;
        realAppend();
      }

      function closeWebSocket() {
        if (logViewer.streaming && logViewer.webSocketConnection) {
          logViewer.normalClose = true;
          logViewer.webSocketConnection.close(true);
        }
      }

      function safeApply() {
        /* eslint-disable */
        if ($scope.$$destroyed || $scope.$$phase) {
          return;
        }
        /* eslint-enable */
        $scope.$apply();
      }

      // Handle streaming logs
      function requestStreamingLog() {
        resetLog();

        var websocketUrl = logViewer.websocketUrl;
        if (_.isUndefined(websocketUrl)) {
          return;
        }
        closeWebSocket();
        logViewer.streaming = STREAMING_STATUS.CONNECTING;
        logViewer.webSocketConnection = $websocket(websocketUrl, null, {
          reconnectIfNotNormalClose: false
        });

        logViewer.webSocketConnection.onMessage(function (message) {
          var logData = message.data;
          if (angular.isFunction(logViewer.filter)) {
            logData = logViewer.filter(logData);
          }
          var htmlMessage;
          if (logViewer.colorize) {
            htmlMessage = colorizer.ansiColorsToHtml(logData);
          } else {
            htmlMessage = logData;
          }
          logViewer.currentLog += htmlMessage;
          appendLog();
        }, {autoApply: false});

        logViewer.webSocketConnection.onOpen(function (event) {
          $log.debug('WebSocket connection opened', event);
          logViewer.streaming = STREAMING_STATUS.ONLINE;
          safeApply();
        });

        logViewer.webSocketConnection.onClose(function (event) {
          if (!logViewer.normalClose) {
            $log.warn('WebSocket connection severed', event);
          }
          logViewer.normalClose = false;
          logViewer.streaming = STREAMING_STATUS.CLOSED;
          safeApply();
        });
      }

      function requestLog() {
        if (logViewer.streaming) {
          requestStreamingLog();
        } else {
          setStaticLogText();
        }
      }

      $scope.$watch('logViewer.logText', function (newVal) {
        if (!_.isUndefined(newVal)) {
          setStaticLogText();
        }
      });

      $scope.$watch('logViewer.websocketUrl', function (newVal) {
        if (!_.isUndefined(newVal)) {
          requestStreamingLog();
        }
      });

      $scope.$watch('logViewer.autoScrollOn', function (newVal) {
        if (!_.isUndefined(newVal)) {
          autoScroll();
        }
      });

      // If the filter is changed on the fly we need to reset
      $scope.$watch('logViewer.filter', function (newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        requestLog();
      });

      // If colorize is changed on the fly we need to reset
      $scope.$watch('logViewer.colorize', function (newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        requestLog();
      });

      // If autoScrollOn is activated on the fly we need to scroll to bottom
      $scope.$watch('logViewer.autoScrollOn', function (newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        if (newVal) {
          autoScroll();
        }
      });

      // If the logViewer is hidden and shown again we need to skip a scroll event
      $scope.$watch(function () {
        return logContainer.offsetWidth > 0 && logContainer.offsetHeight > 0;
      }, function (newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        if (newVal) {
          // When the logViewer becomes visible we sometimes get a programmatic scroll event
          automaticScrolled = true;
        }
      });

      // Ensure maxSize is at least 2 divs worth
      $scope.$watch('logViewer.maxSize', function () {
        if (logViewer.maxSize && logViewer.maxSize < 2 * logDivCapacity) {
          logViewer.maxSize = 2 * logDivCapacity;
        }
      });

      $scope.$on('$destroy', function () {
        closeWebSocket();
      });

    }

    // Replace directives are not going anywhere, see:
    // https://github.com/angular/angular.js/commit/eec6394a342fb92fba5270eee11c83f1d895e9fb#commitcomment-8124407
    /* eslint-disable angular/no-directive-replace */
    return {
      restrict: 'E',
      template: '<div class="log-container"></div>',
      replace: true,
      scope: {
        websocketUrl: '=?', // streaming mode
        logText: '=?', // static mode
        autoScrollOn: '=?',
        filter: '=?',
        colorize: '=?',
        maxSize: '=?',
        streaming: '=?'
      },
      controllerAs: 'logViewer',
      bindToController: true,
      link: logViewerLink,
      controller: LogViewerController
    };
    /* eslint-enable angular/no-directive-replace */
  }

})();
