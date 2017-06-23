(function () {

  'use strict';

  angular
    .module('cf-app-ssh')
    .directive('terminalViewer', terminalViewer);

  /**
   * @name terminalViewer
   */
  function terminalViewer(AnsiColorsService, $websocket, $log, $window) {

    var term;

    var STREAMING_STATUS = {
      NOT_STREAMING: 0,
      ONLINE: 1,
      CONNECTING: 2,
      CLOSED: 3
    };

    var HEADER_HEIGHT = 48;

    // Only one terminal on page at any given time
    function terminalViewerLink(scope, element) {
      term = new Terminal({
        cols: 80,
        rows: 40
      });
      term.open(element[0]);
      term.fit();

      function onResize(ev, sz) {
        var h = sz.height - HEADER_HEIGHT;
        element.innerHeight(h);
        var terminalElement = element.find('.terminal');
        terminalElement.innerHeight(h);
        var overlayElement = element.find('.terminal-info-overlay');
        overlayElement.innerHeight(h);
        term.fit();
      }

      var removeResizeListener = scope.$on('cf-app-ssh-resize', onResize);
      scope.$on('$destroy', removeResizeListener);
    }

    function TerminalViewerController($scope) {
      var terminalViewer = this;
      terminalViewer.streaming = STREAMING_STATUS.NOT_STREAMING;

      terminalViewer.terminal = {
        close: closeWebSocket
      };

      terminalViewer.overlay = '';

      $scope.$on('$destroy', function () {
        closeWebSocket();
      });

      function closeWebSocket() {
        if (terminalViewer.streaming && terminalViewer.webSocketConnection) {
          terminalViewer.normalClose = true;
          terminalViewer.webSocketConnection.close(true);
          terminalViewer.websocketUrl = undefined;
          term.off('data', termSendData);
          term.off('resize', termResize);
        }
      }

      /* eslint-disable angular/no-private-call */
      function safeApply() {
        if ($scope.$$destroyed || $scope.$$phase) {
          return;
        }
        $scope.$apply();
      }
      /* eslint-enable angular/no-private-call */

      function termSendData(d) {
        if (terminalViewer.webSocketConnection) {
          terminalViewer.webSocketConnection.send({key: d});
        }
      }

      function termResize(size) {
        if (terminalViewer.webSocketConnection) {
          terminalViewer.webSocketConnection.send({cols: size.cols, rows: size.rows});
        }

        $scope.$apply(function () {
          terminalViewer.overlay = size.cols + ' x ' + size.rows;
        });
      }

      // Handle streaming logs
      function requestStreamingLog() {
        var websocketUrl = terminalViewer.websocketUrl;
        if (_.isUndefined(websocketUrl)) {
          return;
        }
        closeWebSocket();
        terminalViewer.streaming = STREAMING_STATUS.CONNECTING;
        terminalViewer.webSocketConnection = $websocket(websocketUrl, null, {
          reconnectIfNotNormalClose: false
        });

        term.on('data', termSendData);
        term.on('resize', termResize);
        term.reset();

        // Initial resize
        var geo = term.proposeGeometry();
        terminalViewer.webSocketConnection.send(geo);

        terminalViewer.webSocketConnection.onMessage(function (message) {
          var logData = message.data;
          _.each(logData.split(' '), function (c) {
            var code = parseInt(c, 16);
            term.write(String.fromCharCode(code));
          });
        }, {autoApply: false});

        terminalViewer.webSocketConnection.onOpen(function (event) {
          $log.debug('WebSocket connection opened', event);
          terminalViewer.streaming = STREAMING_STATUS.ONLINE;
          safeApply();
          term.focus();
        });

        terminalViewer.webSocketConnection.onClose(function (event) {
          if (!terminalViewer.normalClose) {
            $log.warn('WebSocket connection severed', event);
          }
          terminalViewer.normalClose = false;
          terminalViewer.streaming = STREAMING_STATUS.CLOSED;
          terminalViewer.websocketUrl = undefined;
          term.off('data', termSendData);
          term.off('resize', termResize);
          safeApply();
        });
      }

      $scope.$watch('terminalViewer.websocketUrl', function (newVal) {
        if (!_.isUndefined(newVal)) {
          requestStreamingLog();
        }
      });
    }

    // Replace directives are not going anywhere, see:
    // https://github.com/angular/angular.js/commit/eec6394a342fb92fba5270eee11c83f1d895e9fb#commitcomment-8124407
    /* eslint-disable angular/no-directive-replace */
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'cf-app-ssh/view/terminal-viewer/terminal-viewer.html',
      controllerAs: 'terminalViewer',
      bindToController: {
        websocketUrl: '=',
        streaming: '=',
        terminal: '='
      },
      scope: {},
      link: terminalViewerLink,
      controller: TerminalViewerController
    };
    /* eslint-enable angular/no-directive-replace */
  }
})();
